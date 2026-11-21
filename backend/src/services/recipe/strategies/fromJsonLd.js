import { asList } from "../../../utils/index.js";
import { findRecipeNodes } from "./findRecipeNodes.js";

/** Parse JSON, retrying once with common site mistakes fixed (raw newlines, trailing commas). */
function parseLenientJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/[\n\r\t]/g, " ").replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

const ingredientCount = (node) => asList(node.recipeIngredient || node.ingredients).length;

/** Strategy 1: <script type="application/ld+json"> containing a schema.org Recipe. */
export function fromJsonLd($) {
  for (const el of $('script[type*="ld+json" i]').toArray()) {
    const raw = $(el).text().trim();
    if (!raw) continue;

    const nodes = findRecipeNodes(parseLenientJson(raw));
    if (nodes.length) {
      // a page can list several recipes; keep the most complete one
      return nodes.reduce((best, node) => (ingredientCount(node) > ingredientCount(best) ? node : best));
    }
  }
  return null;
}
