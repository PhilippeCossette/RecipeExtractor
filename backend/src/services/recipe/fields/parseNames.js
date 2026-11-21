import { asList, cleanText } from "../../../utils/index.js";

/** recipeCategory / recipeCuisine: "Dessert, Snack" or ["Dessert"] or [{ name }] -> unique list. */
export function parseNames(value) {
  const out = [];
  for (let item of asList(value)) {
    if (item && typeof item === "object") item = item.name;
    if (typeof item === "string") out.push(...item.split(",").map(cleanText).filter(Boolean));
  }
  return [...new Set(out)];
}
