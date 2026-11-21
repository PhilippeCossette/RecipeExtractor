import { asList, cleanText } from "../../../utils/index.js";

/** keywords: "easy, quick" or ["easy", "quick"] -> ["easy", "quick"]. */
export function parseKeywords(value) {
  if (typeof value === "string") {
    return value.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return asList(value).map(cleanText).filter(Boolean);
}
