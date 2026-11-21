import { config } from "../config/index.js";
import { safeFetch } from "./safeFetch.js";

/**
 * Download a media file (e.g. a video URL returned by the TikTok API) into memory,
 * with a size limit and timeout. Returns { buffer, filename }.
 */
export async function downloadMedia(url, { maxBytes = config.maxUploadBytes, timeoutMs = 60_000, filename = "video.mp4" } = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Only https media URLs are downloaded");

  // safeFetch checks the URL and every redirect (public IPs only) before requesting it.
  const res = await safeFetch(parsed.href, {
    headers: { "User-Agent": config.requestHeaders["User-Agent"] },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`video download returned HTTP ${res.status}`);

  if (Number(res.headers.get("content-length")) > maxBytes) throw new Error("video is too large");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error("video is too large");
  if (buffer.length === 0) throw new Error("video download was empty");

  return { buffer, filename };
}
