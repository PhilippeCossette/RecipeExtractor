import { config } from "../../config/index.js";
import { MAX_REDIRECTS, TIKTOK_HOST_RE } from "./constants.js";

/**
 * Follow a short share link (vm.tiktok.com/xxx) to the full video URL by reading the
 * redirect Location headers. The page itself is never downloaded.
 */
export async function resolveShortLink(url) {
  let current = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      headers: config.requestHeaders,
      signal: AbortSignal.timeout(config.fetchTimeoutMs),
    });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return current;

    const next = new URL(location, current);
    if (!TIKTOK_HOST_RE.test(next.hostname)) throw new Error("Short link points outside TikTok");
    current = next.href;
  }
  return current;
}
