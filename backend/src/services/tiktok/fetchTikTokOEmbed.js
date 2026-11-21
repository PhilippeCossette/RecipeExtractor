import { config } from "../../config/index.js";
import { OEMBED_ENDPOINT } from "./constants.js";

/**
 * TikTok's official, public oEmbed endpoint (the one websites use to embed videos).
 * Historically it returned the caption as `title`; for many videos it now returns only the player,
 * so every field here can be null.
 */
export async function fetchTikTokOEmbed(videoUrl) {
  const res = await fetch(`${OEMBED_ENDPOINT}?url=${encodeURIComponent(videoUrl)}`, {
    headers: { Accept: "application/json", "User-Agent": config.requestHeaders["User-Agent"] },
    signal: AbortSignal.timeout(config.fetchTimeoutMs),
  });
  if (!res.ok) throw new Error(`TikTok oEmbed returned HTTP ${res.status}`);
  const data = await res.json();

  return {
    caption: data.title || null,
    author: data.author_name || data.author_unique_id || null,
    authorUrl: data.author_url || null,
    thumbnail: data.thumbnail_url || null,
  };
}
