const INSTAGRAM_HOST_RE = /^(www\.|m\.)?instagram\.com$/i;
// /reel/<code>, /reels/<code>, /p/<code>, /tv/<code>, optionally after /<username>/
const POST_PATH_RE = /^\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]+)/i;

/**
 * Validate an Instagram post or reel link.
 * Returns { url, shortcode, isReel }. Throws "Not an Instagram link" for other sites or profile links.
 */
export function parseInstagramUrl(input) {
  const raw = String(input).trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!INSTAGRAM_HOST_RE.test(url.hostname)) throw new Error("Not an Instagram link");

  const match = url.pathname.match(POST_PATH_RE);
  if (!match) throw new Error("Not an Instagram link");

  const kind = match[1].toLowerCase();
  const isReel = kind === "reel" || kind === "reels";
  return {
    url: `https://www.instagram.com/${isReel ? "reel" : kind}/${match[2]}/`,
    shortcode: match[2],
    isReel,
  };
}
