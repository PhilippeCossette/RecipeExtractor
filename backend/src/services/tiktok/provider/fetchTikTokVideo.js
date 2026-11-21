import { config } from "../../../config/index.js";
import { vttToText } from "../../../utils/index.js";
import { scrapeCreatorsRequest } from "../../scrapeCreators/index.js";

const firstUrl = (addr) => addr?.url_list?.find((u) => typeof u === "string" && u.startsWith("http")) ?? null;

const BROWSER_IMAGE_RE = /\.(jpe?g|png|webp)(\?|$)/i; // formats every browser shows
const HEIC_RE = /\.heic(\?|$)/i; // Apple's format: Chrome, Firefox and Edge can't show it

/**
 * Cover image a browser can display. TikTok lists the same cover in several formats,
 * usually [heic, heic, jpeg], so prefer a JPEG/PNG/WebP, then anything that isn't HEIC.
 */
function pickImageUrl(...addrs) {
  const urls = addrs.flatMap((addr) => addr?.url_list ?? []).filter((u) => typeof u === "string" && u.startsWith("http"));
  return urls.find((u) => BROWSER_IMAGE_RE.test(u)) ?? urls.find((u) => !HEIC_RE.test(u)) ?? urls[0] ?? null;
}

/** Best no-watermark video URL, as the docs advise: download_no_watermark_addr, or play_addr when has_watermark is false. */
function pickVideoUrl(video) {
  if (!video) return null;
  return (
    firstUrl(video.download_no_watermark_addr) ||
    (video.has_watermark === false ? firstUrl(video.play_addr) : null) ||
    firstUrl(video.play_addr) ||
    firstUrl(video.download_addr)
  );
}

/**
 * Smallest version of the video (video.bit_rate[] lists several qualities, each with play_addr.data_size).
 * Speech-to-text only needs the sound, and a 5 MB file downloads faster and fits OpenAI's 25 MB limit.
 */
function pickSmallestVideoUrl(video) {
  const options = (video?.bit_rate ?? [])
    .map((entry) => ({ url: firstUrl(entry.play_addr), size: Number(entry.play_addr?.data_size) || Number(entry.bit_rate) || Infinity }))
    .filter((o) => o.url)
    .sort((a, b) => a.size - b.size);
  return options[0]?.url ?? null;
}

/**
 * Get a TikTok post's details from ScrapeCreators (GET /v2/tiktok/video, 1 credit).
 * TikTok's own subtitles come back in the same call at no extra cost.
 *
 * Returns { caption, username, nickname, thumbnail, durationSeconds, videoId, videoUrl, smallVideoUrl, subtitles }.
 */
export async function fetchTikTokVideo(tiktokUrl) {
  const body = await scrapeCreatorsRequest("/v2/tiktok/video", {
    url: tiktokUrl,
    get_transcript: true,
    region: config.scrapeCreators.region,
  });

  const post = body.aweme_detail ?? {};
  const video = post.video ?? {};
  const durationMs = Number(video.duration);

  return {
    caption: typeof post.desc === "string" && post.desc.trim() ? post.desc : null,
    username: post.author?.unique_id ?? null,
    nickname: post.author?.nickname ?? null,
    thumbnail: pickImageUrl(video.cover, video.origin_cover),
    durationSeconds: Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs / 1000) : null,
    videoId: post.aweme_id ?? null,
    videoUrl: pickVideoUrl(video),
    smallVideoUrl: pickSmallestVideoUrl(video),
    subtitles: vttToText(body.transcript) || null,
  };
}
