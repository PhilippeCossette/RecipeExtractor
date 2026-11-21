import { canonicalUrl, detectPlatform } from "../../utils/index.js";
import { parseInstagramUrl } from "../instagram/index.js";
import { parseTikTokUrl } from "../tiktok/index.js";
import { parseYouTubeUrl } from "../youtube/index.js";

/**
 * One key per recipe source, so the same post or page is only saved once per user:
 *   TikTok    -> "tiktok:<video id>"       Instagram -> "instagram:<shortcode>"
 *   YouTube   -> "youtube:<video id>"      website   -> "web:<canonical url>" (see canonicalUrl)
 * Different links to the same video (youtu.be vs /shorts/, ?si=..., m.) give the same key.
 */

const idFromLink = {
  tiktok: (url) => parseTikTokUrl(url).videoId, // null for vm.tiktok.com short links (not resolved here)
  instagram: (url) => parseInstagramUrl(url).shortcode,
  youtube: (url) => parseYouTubeUrl(url).videoId,
};

/** Key for a link, or null when it can't be known from the link alone (e.g. a TikTok short link). */
export function sourceKeyFromUrl(link) {
  let url;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const platform = detectPlatform(url);
  if (platform === "website") {
    const canonical = canonicalUrl(url.href);
    return canonical ? `web:${canonical}` : null;
  }
  try {
    const id = idFromLink[platform](url.href);
    return id ? `${platform}:${id}` : null;
  } catch {
    return null;
  }
}

/** Key for an extracted recipe: the platform's own id when the API gave one, else from its source URL. */
export function sourceKeyForRecipe(recipe) {
  const platform = recipe.platform ?? (recipe.sourceUrl ? detectPlatformSafe(recipe.sourceUrl) : null);
  if (platform && platform !== "website" && recipe.videoId) return `${platform}:${recipe.videoId}`;
  return recipe.sourceUrl ? sourceKeyFromUrl(recipe.sourceUrl) : null;
}

function detectPlatformSafe(link) {
  try {
    return detectPlatform(new URL(link));
  } catch {
    return null;
  }
}
