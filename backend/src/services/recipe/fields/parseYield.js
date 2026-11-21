import { asList, cleanText } from "../../../utils/index.js";

/** recipeYield: "4" / "4 servings" / ["4", "4 servings"] -> { yield: "4 servings", servings: 4 }. */
export function parseYield(value) {
  const items = asList(value).filter((v) => v !== "" && v != null).map(cleanText);
  if (!items.length) return { yield: null, servings: null };

  const text = items.reduce((a, b) => (b.length > a.length ? b : a)); // most descriptive wins
  const number = items.join(" ").match(/\d+/);
  return { yield: text, servings: number ? Number(number[0]) : null };
}
