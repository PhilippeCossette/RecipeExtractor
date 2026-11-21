import { findListAfterHeading } from "./findListAfterHeading.js";

const INGREDIENTS_HEADING = /^\s*(ingr[eé]dients?|what you('ll)? need)\b/i;
const INSTRUCTIONS_HEADING = /^\s*(instructions?|directions?|method|preparation|steps|pr[eé]paration|[eé]tapes)\b/i;

/** Strategy 3 (fallback): an "Ingredients" heading followed by a list. */
export function fromHeuristics($) {
  const ingredients = findListAfterHeading($, INGREDIENTS_HEADING);
  if (!ingredients.length) return null;

  return {
    "@type": "Recipe",
    name: $('meta[property="og:title"]').attr("content") || $("title").text() || null,
    recipeIngredient: ingredients,
    recipeInstructions: findListAfterHeading($, INSTRUCTIONS_HEADING),
  };
}
