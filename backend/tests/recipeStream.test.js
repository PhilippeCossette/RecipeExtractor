import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";
import { setInstagramProvider } from "../src/services/instagram/index.js";

// POST /recipe/stream with fake Instagram + Claude: check the status lines and the final result.

config.costLog.enabled = false;
config.ai.enabled = true;
Object.assign(config.scrapeCreators, { enabled: true, apiKey: "test-key" });
setAnthropicClient({
  beta: {
    messages: {
      // Like Claude: a recipe only when the text has one.
      parse: async (req) => {
        const hasRecipe = /shrimp/.test(req.messages[0].content) && /butter/.test(req.messages[0].content);
        return {
          stop_reason: "end_turn",
          model: "claude-opus-5-5",
          usage: { input_tokens: 2000, output_tokens: 1000 },
          parsed_output: {
            isRecipe: hasRecipe, title: hasRecipe ? "Garlic Shrimp" : null, description: null, servings: 2, yield: null,
            prepMinutes: null, cookMinutes: 5, totalMinutes: null,
            ingredients: hasRecipe ? ["300 g shrimp", "2 tbsp butter"] : [], instructions: ["Cook."], tips: [],
          },
        };
      },
    },
  },
});

let server;
let base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

/** POST and read every NDJSON line. */
async function stream(url) {
  const res = await fetch(`${base}/recipe/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const text = await res.text();
  return { res, events: res.ok ? text.trim().split("\n").map((line) => JSON.parse(line)) : JSON.parse(text) };
}

test("streams each step, then the recipe with its cost", async () => {
  setInstagramProvider({
    fetchPost: async () => ({ caption: "the best dinner ever 🔥 #shrimp", isVideo: true, videoUrl: "https://cdn/ig.mp4", username: "chef" }),
    fetchTranscript: async () => "melt two tablespoons of butter, add 300 grams of shrimp and cook for five minutes",
  });
  const { res, events } = await stream("https://www.instagram.com/reel/ABC123/");
  assert.equal(res.headers.get("content-type"), "application/x-ndjson; charset=utf-8");

  const steps = events.filter((e) => e.type === "status").map((e) => e.step);
  assert.deepEqual(steps, ["check-link", "fetch-instagram", "read-caption", "get-transcript", "ai-transcript"]);
  assert.equal(events.find((e) => e.step === "read-caption").message, "Reading the caption");

  const last = events.at(-1);
  assert.equal(last.type, "result");
  assert.equal(last.recipe.found, true);
  assert.equal(last.recipe.platform, "instagram");
  assert.equal(last.recipe.title, "Garlic Shrimp");
  assert.equal(last.recipe.cost.totalUsd, 0.028);
});

test("a recipe that isn't found still ends with a result (found: false)", async () => {
  setInstagramProvider({
    fetchPost: async () => ({ caption: "vibes", isVideo: false, username: "chef" }),
    fetchTranscript: async () => null,
  });
  const { events } = await stream("https://www.instagram.com/p/XYZ/");
  const last = events.at(-1);
  assert.equal(last.type, "result");
  assert.equal(last.recipe.found, false);
  assert.ok(last.recipe.reason);
});

test("an unsafe link is refused with 400 before streaming", async () => {
  const { res, events } = await stream("http://127.0.0.1/admin");
  assert.equal(res.status, 400);
  assert.match(events.issues[0].message, /not allowed/);
});
