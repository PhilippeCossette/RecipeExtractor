import { scrapeCreatorsRequest } from "../../scrapeCreators/index.js";

/**
 * The video's captions from ScrapeCreators (GET /v1/youtube/video/transcript).
 * 1 credit when captions exist, 0 when there are none. Returns the text, or null.
 */
export async function fetchYouTubeTranscript(videoUrl) {
  const body = await scrapeCreatorsRequest(
    "/v1/youtube/video/transcript",
    { url: videoUrl },
    { fallbackCredits: (b) => (b?.transcript ? 1 : 0) }
  );
  const text =
    (typeof body?.transcript_only_text === "string" && body.transcript_only_text.trim()) ||
    (Array.isArray(body?.transcript) ? body.transcript.map((line) => line?.text).filter(Boolean).join(" ") : "");
  return text.trim() || null;
}
