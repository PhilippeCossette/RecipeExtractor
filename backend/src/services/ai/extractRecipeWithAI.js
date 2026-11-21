import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { config } from "../../config/index.js";
import { priceClaudeUsage, recordCost } from "../cost/index.js";
import { getAnthropicClient } from "./anthropicClient.js";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompts.js";
import { AiRecipeSchema } from "./recipeSchema.js";

const fail = (reason) => ({ found: false, reason });

function describeApiError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "the Anthropic API key is invalid";
  if (err instanceof Anthropic.RateLimitError) return "rate limited by the Anthropic API, try again shortly";
  if (err instanceof Anthropic.BadRequestError) return `bad request (${err.message})`;
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status ?? ""}`.trim();
  return err.message;
}

/**
 * Ask Claude to pull a recipe out of a caption and/or a speech transcript.
 * Returns { found: true, recipe } with the AiRecipeSchema fields, or { found: false, reason }.
 * Never throws.
 */
export async function extractRecipeWithAI({ caption, transcript }) {
  if (!config.ai.enabled) {
    return fail("AI extraction is off. Set ANTHROPIC_API_KEY to turn it on.");
  }
  const userMessage = buildUserMessage({ caption, transcript });
  if (userMessage.length > config.ai.maxInputChars) {
    return fail(`The text is too long for AI extraction (over ${config.ai.maxInputChars} characters).`);
  }

  let response;
  try {
    response = await getAnthropicClient().beta.messages.parse({
      model: config.ai.model,
      max_tokens: config.ai.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      output_config: { effort: config.ai.effort, format: betaZodOutputFormat(AiRecipeSchema) },
      // If the model declines (safety classifier false positive), the API retries on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
  } catch (err) {
    console.error("AI extraction failed:", err);
    return fail(`AI extraction failed: ${describeApiError(err)}.`);
  }

  // Billed even when the answer is a refusal or cut off, so record it first.
  // response.model is the model that answered (a fallback model if the first one declined).
  const model = response.model ?? config.ai.model;
  recordCost({
    service: "claude",
    model,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    usd: priceClaudeUsage(model, response.usage),
  });

  if (response.stop_reason === "refusal") return fail("The AI declined to process this content.");
  if (response.stop_reason === "max_tokens") return fail("The AI response was cut off. Try a shorter video.");

  const recipe = response.parsed_output;
  if (!recipe) return fail("The AI returned an unreadable answer.");
  if (!recipe.isRecipe || recipe.ingredients.length === 0) {
    return fail("The AI didn't find a recipe in this video.");
  }
  return { found: true, recipe };
}
