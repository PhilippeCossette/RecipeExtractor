import { hasSchemaType } from "../../../utils/index.js";

const NESTED_KEYS = ["@graph", "mainEntity", "mainEntityOfPage", "itemListElement", "item"];

/** Recursively collect every schema.org Recipe node inside parsed JSON-LD. */
export function findRecipeNodes(data) {
  if (Array.isArray(data)) return data.flatMap(findRecipeNodes);
  if (!data || typeof data !== "object") return [];

  const found = hasSchemaType(data, "Recipe") ? [data] : [];
  for (const key of NESTED_KEYS) {
    if (key in data) found.push(...findRecipeNodes(data[key]));
  }
  return found;
}
