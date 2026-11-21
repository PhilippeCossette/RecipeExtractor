import { pricing } from "../../config/pricing.js";

/**
 * USD cost of one Claude response from its `usage` block, or null when the model has no price in config/pricing.js.
 * @param {string} model
 * @param {{ input_tokens?: number, output_tokens?: number, cache_read_input_tokens?: number | null, cache_creation_input_tokens?: number | null }} usage
 */
export function priceClaudeUsage(model, usage) {
  const price = pricing.anthropic[model];
  if (!price || !usage) return null;
  const perToken = (perMillion) => perMillion / 1_000_000;
  return (
    (usage.input_tokens ?? 0) * perToken(price.input) +
    (usage.cache_read_input_tokens ?? 0) * perToken(price.input) * pricing.anthropicCacheReadMultiplier +
    (usage.cache_creation_input_tokens ?? 0) * perToken(price.input) * pricing.anthropicCacheWriteMultiplier +
    (usage.output_tokens ?? 0) * perToken(price.output)
  );
}
