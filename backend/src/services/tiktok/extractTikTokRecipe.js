import { config } from "../../config/index.js";
import { recipeFromSources } from "../video/index.js";
import { fetchTikTokOEmbed } from "./fetchTikTokOEmbed.js";
import { getTikTokTranscript } from "./getTikTokTranscript.js";
import { parseTikTokUrl } from "./parseTikTokUrl.js";
import { tiktokProvider } from "./provider/index.js";
import { resolveShortLink } from "./resolveShortLink.js";
import { reportProgress } from "../progress/index.js";

const NOT_TIKTOK = "Not a TikTok link";

/** Validate the link and follow short links. Throws "Not a TikTok link" for other sites. */
async function normalizeLink(link) {
  const parsed = parseTikTokUrl(link);
  if (!parsed.isShortLink) return parsed;
  try {
    return parseTikTokUrl(await resolveShortLink(parsed.url));
  } catch {
    return parsed; // let the TikTok API try the short link itself
  }
}

/**
 * Everything we can learn from a link: the paid TikTok API when SCRAPECREATORS_API_KEY is set
 * (caption, subtitles, video URL), otherwise TikTok's free oEmbed (usually no caption).
 */
async function lookUpVideo(link) {
  const info = { url: null, username: null, videoId: null, caption: null, author: null, thumbnail: null, videoUrl: null, subtitles: null, durationSeconds: null, warnings: [] };

  const parsed = await normalizeLink(link); // throws NOT_TIKTOK
  Object.assign(info, { url: parsed.url, username: parsed.username, videoId: parsed.videoId });

  if (config.scrapeCreators.enabled) {
    try {
      reportProgress("fetch-tiktok");
      const v = await tiktokProvider.fetchVideo(parsed.url);
      return {
        ...info,
        caption: v.caption,
        author: v.nickname ?? (v.username ? `@${v.username}` : null),
        username: v.username ?? info.username,
        videoId: v.videoId ?? info.videoId,
        thumbnail: v.thumbnail,
        videoUrl: v.videoUrl,
        smallVideoUrl: v.smallVideoUrl,
        subtitles: v.subtitles,
        durationSeconds: v.durationSeconds,
      };
    } catch (err) {
      info.warnings.push(`TikTok API: ${err.message}`);
    }
  }

  try {
    const oembed = await fetchTikTokOEmbed(parsed.url);
    Object.assign(info, { caption: oembed.caption, author: oembed.author, thumbnail: oembed.thumbnail });
  } catch (err) {
    info.warnings.push(err.message);
  }
  return info;
}

/**
 * Get a recipe from a TikTok link, with no download needed from the user:
 *   1. rules on the caption  2. AI on the caption
 *   3. AI on what's said in the video (TikTok's subtitles, or server-side download + speech-to-text)
 * `caption` from your app is optional and overrides the API's caption.
 * Never throws: failures come back as { found: false, reason, attempts }.
 */
export async function extractTikTokRecipe({ url, caption } = {}) {
  let video = {};
  if (url) {
    try {
      video = await lookUpVideo(url);
    } catch (err) {
      if (err.message === NOT_TIKTOK) return { found: false, sourceUrl: url, reason: "That isn't a TikTok link." };
      throw err;
    }
  }

  const source = {
    sourceUrl: video.url ?? url ?? null,
    siteName: "TikTok",
    author: video.author ?? (video.username ? `@${video.username}` : null),
    image: video.thumbnail ?? null,
    video: video.url ?? null,
    videoId: video.videoId ?? null,
  };

  const hasVideo = Boolean(video.subtitles || video.videoUrl || video.smallVideoUrl);
  const result = await recipeFromSources({
    caption: caption?.trim() || video.caption,
    getTranscript: hasVideo ? () => getTikTokTranscript(video) : undefined,
    noTranscriptReason: config.scrapeCreators.enabled
      ? "Couldn't get the video from the TikTok API."
      : "Set SCRAPECREATORS_API_KEY so the server can get the caption and video from the link, or send the caption as `caption`.",
  });

  const warnings = video.warnings?.length ? { warnings: video.warnings } : {};
  return { ...result, ...source, ...warnings };
}
