import {
  getYouTubeVideoId,
  TranscriptError,
  transcriptFromYouTubeId,
  transcriptToTextFile,
} from "./youtube";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    const videoParams = searchParams.getAll("v");
    const includeTimestamps = searchParams.get("timestamps") === "true";
    const filterOutMusic = searchParams.get("filterOutMusic") === "true";

    // Get unique, valid video IDs
    const videoIds = [
      ...new Set(
        videoParams
          .map((param) => getYouTubeVideoId(param))
          .filter((id) => id !== null)
      ),
    ];

    if (!videoIds.length) {
      const ending = url.toString().split(url.host)[1];
      console.log("[ending]", ending);
      const id = getYouTubeVideoId(ending);
      if (id) {
        videoIds.push(id);
      } else {
        return new Response("No valid video IDs provided", { status: 400 });
      }
    }

    // Fetch all transcripts in parallel
    const transcripts = await Promise.all(
      videoIds.map(async (id) => {
        const result = await transcriptFromYouTubeId(id);

        return { ...result, id };
      })
    );

    // Filter out failed transcripts and format them
    const formattedTranscripts = transcripts
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) =>
        transcriptToTextFile({
          transcript: t,
          includeTimestamps,
          filterOutMusic,
        })
      );

    if (!formattedTranscripts.length) {
      return new Response("Failed to fetch any transcripts", { status: 404 });
    }

    // Combine all transcripts with separator
    const combinedText = formattedTranscripts.join(
      "\n\n====video ended====\n\n"
    );

    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    transcripts.forEach(({ transcript, ...t }) => {
      if (t) {
        headers.set(
          "title",
          Buffer.from(t.videoTitle.toString()).toString("base64")
        );
        if (t.imageUrl) {
          headers.set(
            "img-url",
            Buffer.from(t.imageUrl.toString()).toString("base64")
          );
        }
        headers.set("id", Buffer.from(t.id.toString()).toString("base64"));
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
