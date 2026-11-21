import { config } from "../../config/index.js";
import { extractRecipeWithAI, toRecipeResponse } from "../ai/index.js";
import { parseCaption } from "../tiktok/caption/index.js";
import { captionMightHaveRecipe } from "./captionMightHaveRecipe.js";
import { reportProgress } from "../progress/index.js";

/**
 * Get a recipe from a post's caption, cheapest method first:
 *   1. "caption"     rule-based caption parser (free, instant)
 *   2. "ai-caption"  Claude reads the caption (messy formatting, no "Ingredients:" heading)
 *
 * With `skipUnlikelyCaptions`, step 2 is skipped when the caption has no numbers, units or recipe
 * words (e.g. "recipe in the comments 😭"). Callers set it when the video's audio is available next,
 * so a hopeless caption doesn't cost an AI call (~10 s).
 *
 * @param {string | null | undefined} caption
 * @param {{ skipUnlikelyCaptions?: boolean }} [options]
 * @returns {Promise<object>} recipe response, or { found: false, reason, attempts, keywords }
 */
export async function recipeFromCaption(caption, { skipUnlikelyCaptions = false } = {}) {
  const text = caption?.trim() || null;
  if (!text) {
    return notFound([{ method: "caption", reason: "No caption was available." }], []);
  }

  const attempts = []; // why each step didn't work, so the client can show something useful

  // 1. Rules
  reportProgress("read-caption");
  const parsed = parseCaption(text);
  if (parsed.found) {
    return { found: true, extractionMethod: "caption", ...parsed, caption: text };
  }
  attempts.push({ method: "caption", reason: parsed.reason });

  // 2. AI on the caption
  if (skipUnlikelyCaptions && !captionMightHaveRecipe(text)) {
    attempts.push({ method: "ai-caption", reason: "Skipped: the caption doesn't look like it has a recipe." });
    return notFound(attempts, parsed.keywords);
  }
  if (!config.ai.enabled) {
    attempts.push({ method: "ai-caption", reason: "AI extraction is off. Set ANTHROPIC_API_KEY to turn it on." });
    return notFound(attempts, parsed.keywords);
  }
  reportProgress("ai-caption");
  const ai = await extractRecipeWithAI({ caption: text });
  if (ai.found) {
    return toRecipeResponse(ai.recipe, { extractionMethod: "ai-caption", caption: text, keywords: parsed.keywords });
  }
  attempts.push({ method: "ai-caption", reason: ai.reason });
  return notFound(attempts, parsed.keywords);
}

function notFound(attempts, keywords) {
  return { found: false, reason: attempts.at(-1).reason, attempts, keywords };
}
