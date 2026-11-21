import { stripEmojis } from "../../utils/index.js";

// Quantities: "2", "1/2", "½"
const NUMBER_RE = /\d|[½¼¾⅓⅔⅛]/;
// Measurement and recipe words (English + French)
const RECIPE_WORD_RE =
  /\b(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|grams?|g|kg|ml|l|oz|ounces?|lbs?|pounds?|pinch|cloves?|tasses?|c\. ?à|cuill[eè]res?|gousses?|pinc[ée]es?|ingr[ée]dients?|preheat|bake|simmer|whisk|chop|mix|stir|pr[ée]chauffer|cuire|m[ée]langer)\b/i;
const LONG_CAPTION = 200; // long captions can describe a recipe in words

/**
 * Cheap guess at whether a caption could contain a recipe, so we can skip the AI caption step
 * for captions like "recipe in the comments 😭 #fyp" and go straight to the video's audio.
 */
export function captionMightHaveRecipe(caption) {
  const text = stripEmojis(String(caption ?? ""))
    .replace(/#[\p{L}\p{N}_]+/gu, " ") // hashtags
    .replace(/@[\w.]+/g, " ") // mentions
    .replace(/https?:\/\/\S+/g, " ") // links
    .replace(/\s+/g, " ")
    .trim();

  if (text.length >= LONG_CAPTION) return true;
  return NUMBER_RE.test(text) || RECIPE_WORD_RE.test(text);
}
