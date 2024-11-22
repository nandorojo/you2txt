interface TranscriptResponse {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResult {
  videoTitle: string;
  description: string;
  transcript: TranscriptResponse[];
}

class TranscriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptError";
  }
}

export async function transcriptFromYouTubeId(
  videoId: string
): Promise<TranscriptResult> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl);
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

    // Get captions data
    const captions =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captions?.length) {
      throw new TranscriptError("No captions available for this video");
    }

    // Fetch transcript data
    const captionUrl = `${captions[0].baseUrl}&fmt=json3`;
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

    return {
      videoTitle,
      description,
      transcript,
    };
  } catch (error) {
    if (error instanceof TranscriptError) {
      throw error;
    }
    throw new TranscriptError("Failed to process transcript");
  }
}
