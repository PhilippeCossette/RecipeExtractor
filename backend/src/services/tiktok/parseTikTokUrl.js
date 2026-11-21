import { SHORT_LINK_RE, SHORT_PATH_RE, TIKTOK_HOST_RE, VIDEO_PATH_RE } from "./constants.js";

/**
 * Validate a TikTok link and pull out what we can.
 * Returns { url, isShortLink, username, videoId }. Throws for non-TikTok URLs.
 */
export function parseTikTokUrl(input) {
  const raw = String(input).trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!TIKTOK_HOST_RE.test(url.hostname)) throw new Error("Not a TikTok link");

  const isShortLink = SHORT_LINK_RE.test(url.hostname) || SHORT_PATH_RE.test(url.pathname);
  const match = url.pathname.match(VIDEO_PATH_RE);

  return {
    url: match ? `https://www.tiktok.com/@${match[1]}/video/${match[2]}` : url.href,
    isShortLink,
    username: match?.[1] ?? null,
    videoId: match?.[2] ?? null,
  };
}
