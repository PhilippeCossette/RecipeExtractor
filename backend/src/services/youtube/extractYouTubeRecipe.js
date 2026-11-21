import { config } from "../../config/index.js";
import { recipeFromSources } from "../video/index.js";
import { parseYouTubeUrl } from "./parseYouTubeUrl.js";
import { youtubeProvider } from "./provider/index.js";
import { reportProgress } from "../progress/index.js";

const MIN_TRANSCRIPT_CHARS = 40;

/**
 * Get a recipe from a YouTube Short (or video) link:
 *   1. rules on the title + description  2. AI on them
 *   3. AI on YouTube's captions ("youtube-captions")
 * There's no audio fallback: YouTube videos aren't downloaded, so a video with no recipe in the
 * description and no captions isn't found.
 * Never throws for bad links or API problems: they come back as { found: false, reason }.
 */
export async function extractYouTubeRecipe({ url, caption } = {}) {
  let parsed = null;
  if (url) {
    try {
      parsed = parseYouTubeUrl(url);
    } catch {
      return { found: false, sourceUrl: url, reason: "That isn't a YouTube Short or video link." };
    }
  }

  let video = {};
  const warnings = [];
  if (parsed && config.scrapeCreators.enabled) {
    try {
      reportProgress("fetch-youtube");
      video = await youtubeProvider.fetchVideo(parsed.url);
    } catch (err) {
      warnings.push(`YouTube API: ${err.message}`);
    }
  } else if (parsed) {
    warnings.push("Set SCRAPECREATORS_API_KEY so the server can read YouTube videos.");
  }

  const source = {
    sourceUrl: parsed?.url ?? url ?? null,
    siteName: "YouTube",
    author: video.author ?? (video.handle ? `@${video.handle}` : null),
    image: video.thumbnail ?? (parsed ? `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg` : null),
    video: parsed?.url ?? null,
    videoId: parsed?.videoId ?? null,
  };

  // The title's first line helps the rules parser name the recipe; the description usually has the recipe.
  const fromApi = [video.title, video.description].filter(Boolean).join("\n\n") || null;
  const getTranscript = async () => {
    const text = await youtubeProvider.fetchTranscript(parsed.url);
    return text && text.length >= MIN_TRANSCRIPT_CHARS
      ? { ok: true, text, source: "youtube-captions" }
      : { ok: false, reason: "The video has no captions to read, and the description has no recipe." };
  };

  const result = await recipeFromSources({
    caption: caption?.trim() || fromApi,
    getTranscript: parsed && config.scrapeCreators.enabled ? getTranscript : undefined,
    noTranscriptReason: "Set SCRAPECREATORS_API_KEY so the server can read the video's captions.",
  });

  return {
    ...result,
    ...source,
    ...(result.found && !result.title && video.title ? { title: video.title } : {}),
    ...(warnings.length ? { warnings } : {}),
  };
}
