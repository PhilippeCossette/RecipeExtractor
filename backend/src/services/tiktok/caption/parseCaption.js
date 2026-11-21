import { stripEmojis } from "../../../utils/index.js";
import { parseIngredient } from "../../ingredients/index.js";
import { cleanCaption } from "./cleanCaption.js";
import { findTimesAndServings } from "./findTimesAndServings.js";
import { findTitle } from "./findTitle.js";
import { splitCaptionSections } from "./splitCaptionSections.js";
import { splitIngredientItems } from "./splitIngredientItems.js";
import { splitSteps } from "./splitSteps.js";

const MIN_INGREDIENTS = 2;

/**
 * Read a recipe out of a caption (TikTok, Instagram, YouTube Shorts...).
 * Returns the same shape as the website extractor, minus the source details,
 * which the caller fills in.
 */
export function parseCaption(caption) {
  const { text, hashtags } = cleanCaption(caption);
  const sections = splitCaptionSections(text);
  const ingredients = splitIngredientItems(sections.ingredients);

  if (ingredients.length < MIN_INGREDIENTS) {
    return {
      found: false,
      reason:
        "No ingredient list found in the caption. The recipe may only be spoken in the video, or posted in the comments.",
      keywords: hashtags,
    };
  }

  const description = stripEmojis(sections.intro).replace(/\s+/g, " ").trim() || null;

  return {
    found: true,
    title: findTitle(sections.intro),
    description,
    ...findTimesAndServings(text),
    ingredients,
    ingredientsParsed: ingredients.map(parseIngredient),
    instructions: splitSteps(sections.instructions),
    keywords: hashtags,
  };
}
