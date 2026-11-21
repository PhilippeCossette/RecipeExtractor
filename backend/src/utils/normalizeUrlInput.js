const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`]+/i;
const BARE_DOMAIN_RE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#][^\s<>"'`]*)?$/i;
const TRAILING_PUNCTUATION_RE = /[),.;:!?\]}'"]+$/;

/**
 * Turn whatever was pasted into one URL string, or null:
 *   "  https://x.com/a  "                         -> "https://x.com/a"
 *   "Check this out! https://vm.tiktok.com/Z/ 🔥"  -> "https://vm.tiktok.com/Z/"  (share text from apps)
 *   "www.ricardocuisine.com/recettes/1"           -> "https://www.ricardocuisine.com/recettes/1"
 * It doesn't decide if the URL is safe; RecipeUrlSchema does that next.
 */
export function normalizeUrlInput(input) {
  const text = String(input ?? "").trim();
  if (!text) return null;

  const inText = text.match(URL_IN_TEXT_RE)?.[0];
  if (inText) return inText.replace(TRAILING_PUNCTUATION_RE, "");
  if (BARE_DOMAIN_RE.test(text)) return `https://${text.replace(TRAILING_PUNCTUATION_RE, "")}`;
  return null;
}
