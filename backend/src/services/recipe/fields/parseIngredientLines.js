import { asList, cleanText } from "../../../utils/index.js";

/** recipeIngredient (or the old `ingredients` field) -> clean, non-empty strings. */
export function parseIngredientLines(node) {
  return asList(node.recipeIngredient || node.ingredients).map(cleanText).filter(Boolean);
}
