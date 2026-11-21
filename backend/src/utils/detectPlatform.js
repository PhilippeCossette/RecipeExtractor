/**
 * Which extractor fits a URL, from its host only:
 *   tiktok.com (incl. vm./vt.) -> "tiktok", instagram.com -> "instagram",
 *   youtube.com / youtu.be -> "youtube", anything else -> "website".
 * @param {URL} url
 * @returns {"tiktok" | "instagram" | "youtube" | "website"}
 */
export function detectPlatform(url) {
  const host = url.hostname.toLowerCase();
  if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)youtube\.com$/.test(host) || host === "youtu.be") return "youtube";
  return "website";
}
