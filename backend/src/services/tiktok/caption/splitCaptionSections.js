import { INGREDIENTS_HEADING_RE, INSTRUCTIONS_HEADING_RE, STEP_NUMBER_RE } from "./patterns.js";

/** Index where step "1." starts, or -1. */
function findFirstNumberedStep(text) {
  for (const m of text.matchAll(STEP_NUMBER_RE)) {
    if (m[1] === "1") return m.index;
  }
  return -1;
}

/**
 * Split a caption into { intro, ingredients, instructions } blocks of text.
 * ingredients is null when there's no "Ingredients" heading.
 */
export function splitCaptionSections(text) {
  const ing = text.match(INGREDIENTS_HEADING_RE);
  if (!ing) return { intro: text, ingredients: null, instructions: "" };

  const intro = text.slice(0, ing.index).trim();
  const afterIngredients = text.slice(ing.index + ing[0].length);

  // Steps start at an "Instructions" heading, or else at the first "1." after the ingredients.
  const heading = afterIngredients.match(INSTRUCTIONS_HEADING_RE);
  if (heading) {
    return {
      intro,
      ingredients: afterIngredients.slice(0, heading.index).trim(),
      instructions: afterIngredients.slice(heading.index + heading[0].length).trim(),
    };
  }

  const firstStep = findFirstNumberedStep(afterIngredients);
  if (firstStep !== -1) {
    return {
      intro,
      ingredients: afterIngredients.slice(0, firstStep).trim(),
      instructions: afterIngredients.slice(firstStep).trim(),
    };
  }

  return { intro, ingredients: afterIngredients.trim(), instructions: "" };
}
