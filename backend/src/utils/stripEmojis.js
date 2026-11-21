// Emoji, flags (regional indicators), skin tones, variation selectors, zero-width joiners and keycaps.
const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu;

/** "Pasta 🍝🇮🇹" -> "Pasta". Collapses the leftover spaces. */
export function stripEmojis(text) {
  return String(text).replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").trim();
}
