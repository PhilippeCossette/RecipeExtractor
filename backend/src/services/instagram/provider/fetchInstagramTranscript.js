import { scrapeCreatorsRequest } from "../../scrapeCreators/index.js";

const hasText = (body) => (body?.transcripts ?? []).some((t) => typeof t?.text === "string" && t.text.trim());

/**
 * What's said in an Instagram reel, transcribed by ScrapeCreators (GET /v2/instagram/media/transcript).
 * 1 credit for videos up to 2 minutes, 0 when there's no speech. Returns the text, or null.
 */
export async function fetchInstagramTranscript(postUrl) {
  const body = await scrapeCreatorsRequest(
    "/v2/instagram/media/transcript",
    { url: postUrl },
    { fallbackCredits: (b) => (hasText(b) ? 1 : 0) } // this endpoint doesn't always report credits_charged
  );
  const text = (body?.transcripts ?? [])
    .map((t) => t?.text?.trim())
    .filter(Boolean)
    .join("\n");
  return text || null;
}
