import { config } from "../../../config/index.js";
import { scrapeCreatorsRequest } from "../../scrapeCreators/index.js";

/**
 * An Instagram post or reel from ScrapeCreators (GET /v1/instagram/post, 1 credit).
 * Returns { caption, username, fullName, thumbnail, durationSeconds, shortcode, isVideo, videoUrl }.
 */
export async function fetchInstagramPost(postUrl) {
  const body = await scrapeCreatorsRequest(
    "/v1/instagram/post",
    { url: postUrl, region: config.scrapeCreators.region },
    { retries: 1 } // occasional 404 for public reels that work on the next try
  );
  const media = body?.data?.xdt_shortcode_media ?? {};

  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text;
  const duration = Number(media.video_duration);

  return {
    caption: typeof caption === "string" && caption.trim() ? caption : null,
    username: media.owner?.username ?? null,
    fullName: media.owner?.full_name || null,
    thumbnail: media.display_url ?? media.thumbnail_src ?? null,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
    shortcode: media.shortcode ?? null,
    isVideo: Boolean(media.is_video),
    videoUrl: media.video_url ?? null,
  };
}
