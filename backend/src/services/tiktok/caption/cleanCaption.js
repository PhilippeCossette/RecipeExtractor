import { HASHTAG_RE } from "./patterns.js";

/**
 * Pull hashtags out of a caption and tidy it up.
 * Returns { text, hashtags }. Line breaks are kept; lines that are only "." or "-"
 * (creators use them as spacers) become blank lines.
 */
export function cleanCaption(caption) {
  const hashtags = [...new Set([...String(caption).matchAll(HASHTAG_RE)].map((m) => m[1]))];

  const text = String(caption)
    .replace(/\r\n?/g, "\n")
    .replace(HASHTAG_RE, "")
    .split("\n")
    .map((line) => line.trim())
    .map((line) => (/^[.\-–—_·•]+$/.test(line) ? "" : line))
    .join("\n")
    .replace(/ +\. +(?=\S)/g, "\n") // flattened spacers: "dish 🍝 . Ingredients" -> new line
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, hashtags };
}
