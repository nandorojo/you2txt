import {
  getYouTubeVideoId,
  TranscriptError,
  transcriptFromYouTubeId,
  transcriptToTextFile,
} from "./youtube";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const videoParams = searchParams.getAll("v");
    const includeTimestamps = searchParams.get("timestamps") === "true";

    // Get unique, valid video IDs
    const videoIds = [
      ...new Set(
        videoParams
          .map((param) => getYouTubeVideoId(param))
          .filter((id) => id !== null)
      ),
    ];

    if (!videoIds.length) {
      return new Response("No valid video IDs provided", { status: 400 });
    }

    // Fetch all transcripts in parallel
    const transcripts = await Promise.all(
      videoIds.map(async (id) => {
        try {
          const r = await transcriptFromYouTubeId(id);
          if (!r) {
            throw new Error(`Failed to fetch transcript for video ${id}`);
          }
          return { ...r, id };
        } catch (error) {
          console.error(`Failed to fetch transcript for video ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed transcripts and format them
    const formattedTranscripts = transcripts
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) => transcriptToTextFile({ transcript: t, includeTimestamps }));

    if (!formattedTranscripts.length) {
      return new Response("Failed to fetch any transcripts", { status: 404 });
    }

    // Combine all transcripts with separator
    const combinedText = formattedTranscripts.join(
      "\n\n====video ended====\n\n"
    );

    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    transcripts.forEach((t) => {
      if (t) {
        headers.set("title", t.videoTitle);
        if (t.imageUrl) {
          headers.set("img-url", t.imageUrl);
        }
        headers.set("id", t.id);
      }
    });

    // Return plain text response
    return new Response(combinedText, { headers });
  } catch (error) {
    if (error instanceof TranscriptError) {
      console.error("Transcript processing error:", error.message);
      return new Response(error.message, { status: 500 });
    }
    console.error("Transcript processing error:", error);
    return new Response("Failed to process transcripts", { status: 500 });
  }
}
