import { config } from "../../config/index.js";
import { recipeFromSources } from "../video/index.js";
import { getInstagramTranscript } from "./getInstagramTranscript.js";
import { parseInstagramUrl } from "./parseInstagramUrl.js";
import { instagramProvider } from "./provider/index.js";
import { reportProgress } from "../progress/index.js";

/**
 * Get a recipe from an Instagram reel or post link:
 *   1. rules on the caption  2. AI on the caption
 *   3. AI on what's said in the reel (ScrapeCreators transcript, or download + speech-to-text)
 * `caption` from your app is optional and overrides the API's caption.
 * Never throws for bad links or API problems: they come back as { found: false, reason }.
 */
export async function extractInstagramRecipe({ url, caption } = {}) {
  let parsed = null;
  if (url) {
    try {
      parsed = parseInstagramUrl(url);
    } catch {
      return { found: false, sourceUrl: url, reason: "That isn't an Instagram post or reel link." };
    }
  }

  let post = { url: parsed?.url ?? null };
  const warnings = [];
  if (parsed && config.scrapeCreators.enabled) {
    try {
      reportProgress("fetch-instagram");
      post = { ...post, ...(await instagramProvider.fetchPost(parsed.url)) };
    } catch (err) {
      warnings.push(`Instagram API: ${err.message}`);
    }
  } else if (parsed) {
    warnings.push("Set SCRAPECREATORS_API_KEY so the server can read Instagram posts.");
  }

  const source = {
    sourceUrl: post.url ?? url ?? null,
    siteName: "Instagram",
    author: post.fullName ?? (post.username ? `@${post.username}` : null),
    image: post.thumbnail ?? null,
    video: post.url ?? null,
    videoId: post.shortcode ?? parsed?.shortcode ?? null,
  };

  const canTranscribe = Boolean(parsed && config.scrapeCreators.enabled && (post.isVideo || post.videoUrl));
  const result = await recipeFromSources({
    caption: caption?.trim() || post.caption,
    getTranscript: canTranscribe ? () => getInstagramTranscript(post) : undefined,
    noTranscriptReason: config.scrapeCreators.enabled
      ? "Couldn't get the video from the Instagram API."
      : "Set SCRAPECREATORS_API_KEY so the server can read the post from the link, or send the caption as `caption`.",
  });

  return { ...result, ...source, ...(warnings.length ? { warnings } : {}) };
}
