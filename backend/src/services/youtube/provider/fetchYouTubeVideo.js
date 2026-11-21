import { scrapeCreatorsRequest } from "../../scrapeCreators/index.js";

/**
 * A YouTube Short or video from ScrapeCreators (GET /v1/youtube/video, 1 credit).
 * Returns { title, description, author, handle, thumbnail, durationSeconds, videoId }.
 */
export async function fetchYouTubeVideo(videoUrl) {
  const body = await scrapeCreatorsRequest("/v1/youtube/video", { url: videoUrl }, { retries: 1 });
  const durationMs = Number(body?.durationMs);
  const text = (value) => (typeof value === "string" && value.trim() ? value : null);

  return {
    title: text(body?.title),
    description: text(body?.description),
    author: body?.channel?.title ?? body?.uploader?.author ?? null,
    handle: body?.channel?.handle ?? null,
    thumbnail: body?.thumbnail ?? null,
    durationSeconds: Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs / 1000) : null,
    videoId: body?.id ?? null,
  };
}
