import assert from "node:assert/strict";
import { test } from "node:test";
import { costStorage, priceClaudeUsage, recordCost, summarizeCost } from "../src/services/cost/index.js";

test("priceClaudeUsage: Opus 5.5 at $4 / $20 per million tokens", () => {
  assert.equal(priceClaudeUsage("claude-opus-5-5", { input_tokens: 1_000_000, output_tokens: 0 }), 4);
  assert.equal(priceClaudeUsage("claude-opus-5-5", { input_tokens: 2000, output_tokens: 1000 }), 0.028);
});

test("priceClaudeUsage: cache reads at 0.1x and writes at 1.25x the input price", () => {
  const usd = priceClaudeUsage("claude-opus-5-5", {
    input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000,
  });
  assert.ok(Math.abs(usd - (0.4 + 5)) < 1e-9);
});

test("priceClaudeUsage: unknown model -> null", () => {
  assert.equal(priceClaudeUsage("some-other-model", { input_tokens: 10, output_tokens: 10 }), null);
});

test("summarizeCost adds up items and flags unknown prices", () => {
  const summary = summarizeCost([{ service: "a", usd: 0.002 }, { service: "b", usd: null }]);
  assert.equal(summary.totalUsd, 0.002);
  assert.equal(summary.complete, false);
});

test("recordCost only records inside a tracked request", async () => {
  recordCost({ service: "outside", usd: 1 }); // no tracker: ignored, no error
  const tracker = { items: [] };
  await costStorage.run(tracker, async () => {
    await new Promise((resolve) => setTimeout(resolve, 1)); // survives awaits
    recordCost({ service: "inside", usd: 0.5 });
  });
  assert.deepEqual(tracker.items, [{ service: "inside", usd: 0.5 }]);
});
