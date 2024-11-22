import { Redis } from "@upstash/redis";
import { z } from "zod";
import fetch from "node-fetch";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

interface TranscriptResponse {
  text: string;
  start: number;
  duration: number;
}

type TranscriptResult = z.infer<typeof transcriptResultSchema>;

const transcriptResultSchema = z.object({
  videoTitle: z.string(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  transcript: z.array(
    z.object({
      text: z.string(),
      start: z.number(),
      duration: z.number(),
    })
  ),
});

export class TranscriptError extends Error {
  message: string;
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "TranscriptError";
  }
}

function getRedisCacheKey(videoId: string) {
  return `youtube-transcript-${videoId}`;
}

// async function getVideoProxied(videoId: string) {
//   return new Promise((resolve, reject) =>
//     request(
//       {
//         url: `https://www.youtube.com/watch?v=${videoId}`,
//         proxy: process.env.PROXY_URL,
//       },
//       (err, res) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(res);
//         }
//       }
//     )
//   );
// }

export async function transcriptFromYouTubeId(
  videoId: string,
  ignoreCache = false
): Promise<TranscriptResult> {
  // Check cache first
  if (!ignoreCache) {
    const cacheKey = getRedisCacheKey(videoId);
    const cachedData = transcriptResultSchema.safeParse(
      await redis.get(cacheKey)
    );
    console.log("cached!");

    if (cachedData.success) {
      return cachedData.data;
    }
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log("[proxy]", process.env.PROXY_URL);
  const response = await fetch(videoUrl, {
    // ...(process.env.PROXY_URL && {
    //   agent: new HttpsProxyAgent(process.env.PROXY_URL),
    // }),
  });

  if (!response.ok) {
    console.error("[oh nooo]", await response.text());
    throw new TranscriptError(
      "Failed to fetch video. This might be a YouTube rate limit."
    );
  }

  const html = await response.text();

  // Extract player response data
  const playerResponseMatch = html.match(
    /ytInitialPlayerResponse\s*=\s*({.+?})\s*;/
  );
  if (!playerResponseMatch) {
    throw new TranscriptError("Could not find player response data");
  }

  const playerResponse = JSON.parse(playerResponseMatch[1]);

  // Extract video metadata
  const videoTitle = playerResponse?.videoDetails?.title || "Untitled Video";
  const description = playerResponse?.videoDetails?.shortDescription || "";
  const imageUrl =
    playerResponse?.microformat?.playerMicroformatRenderer?.thumbnail
      ?.thumbnails[0]?.url;

  // Get captions data
  const captions =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  console.log("[captions]", JSON.stringify(playerResponse.captions));
  console.log("[captions][keys]", Object.keys(playerResponse));
  Object.keys(playerResponse).forEach((key) => {
    console.log("[key]", key, Object.keys(playerResponse[key]));
  });
  if (!captions?.length) {
    throw new TranscriptError("No captions available for this video");
  }

  // Fetch transcript data
  const captionUrl = `${captions[0].baseUrl}&fmt=json3&lang=en`;
  const transcriptResponse = await fetch(captionUrl);
  const transcriptData = await transcriptResponse.json();

  // Process transcript events
  const transcript = transcriptData.events
    ?.filter((event: any) => event?.segs?.some((seg: any) => seg?.utf8))
    ?.map((event: any) => {
      const text = event.segs
        .map((seg: any) => seg.utf8?.trim())
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        text,
        start: Number((event.tStartMs / 1000).toFixed(3)),
        duration: Number((event.dDurationMs / 1000).toFixed(3)),
      };
    })
    .filter((item: TranscriptResponse) => item.text);

  if (!transcript?.length) {
    throw new TranscriptError("Failed to parse transcript data");
  }

  const result = {
    videoTitle,
    description,
    transcript,
    imageUrl,
  };

  // Cache the result
  const cacheKey = getRedisCacheKey(videoId);
  await redis.set(cacheKey, result, {
    ex: CACHE_TTL,
  });

  return result;
}

export function getYouTubeVideoId(input: string): string | null {
  // Handle empty/undefined input
  if (!input?.trim()) {
    return null;
  }

  const trimmedInput = input.trim();

  // Check for exact 11-character video ID pattern
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedInput)) {
    return trimmedInput;
  }

  // Normalize URL format
  let normalizedUrl = trimmedInput;
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = normalizedUrl.replace(/^\/\//, "");
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check against known URL patterns
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Final attempt: Try parsing as URL
  try {
    const url = new URL(normalizedUrl);
    const videoId = url.searchParams.get("v");
    if (videoId?.length === 11) {
      return videoId;
    }
  } catch {
    // URL parsing failed, ignore and return null
  }

  return null;
}

export function transcriptToTextFile({
  transcript,
  includeTimestamps = true,
  filterOutMusic = false,
}: {
  transcript: TranscriptResult;
  includeTimestamps?: boolean;
  filterOutMusic?: boolean;
}): string {
  const { videoTitle, description, transcript: segments } = transcript;

  const lines: string[] = [
    "--",
    `Title: ${videoTitle}`,
    "",
    `Description: ${description}`,
    "",
    "--",
    "",
  ];

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `[${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}]`;
  };

  segments.forEach((segment) => {
    if (segment.text.trim() === "[Music]" && filterOutMusic) {
      return;
    }
    const line = includeTimestamps
      ? `${formatTimestamp(segment.start)} ${segment.text}`
      : segment.text;
    lines.push(line);
  });

  return lines.join("\n");
}
