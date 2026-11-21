import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";
import { setOpenAIClient } from "../src/services/transcription/openaiClient.js";

let server;
let base;

// Fake AI + transcription so upload routes can be tested without keys or cost.
config.ai.enabled = true;
config.costLog.enabled = false; // no console lines or log file from tests
config.transcription.enabled = true;
config.transcription.ffmpegPath = "ffmpeg-not-installed-for-tests";
setOpenAIClient({ audio: { transcriptions: { create: async () => ({ text: "two eggs, scrambled in butter", usage: { type: "duration", seconds: 30 } }) } } });
setAnthropicClient({
  beta: {
    messages: {
      parse: async () => ({
        stop_reason: "end_turn",
        model: "claude-opus-5-5",
        usage: { input_tokens: 2000, output_tokens: 1000 },
        parsed_output: {
          isRecipe: true, title: "Scrambled Eggs", description: null, servings: 1, yield: null,
          prepMinutes: null, cookMinutes: 3, totalMinutes: null,
          ingredients: ["2 eggs", "1 tbsp butter"], instructions: ["Scramble the eggs in butter."], tips: [],
        },
      }),
    },
  },
});

const upload = (path, fields, file) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append("video", new Blob([file.bytes], { type: file.type }), file.name);
  return json(path, { method: "POST", body: form });
};

before(async () => {
  server = createApp().listen(0); // random free port
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const json = async (path, init) => {
  const res = await fetch(base + path, init);
  return { status: res.status, body: await res.json() };
};
const post = (path, body) =>
  json(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("GET /health", async () => {
  const { status, body } = await json("/health");
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test("GET /extract without url -> 400", async () => {
  const { status } = await json("/extract");
  assert.equal(status, 400);
});

test("GET /extract refuses private addresses", async () => {
  const { status, body } = await json("/extract?url=" + encodeURIComponent("http://localhost:1/"));
  assert.equal(status, 200);
  assert.equal(body.found, false);
  assert.match(body.reason, /not allowed/);
});

test("POST /ingredients/parse", async () => {
  const { status, body } = await post("/ingredients/parse", { lines: ["2 cups milk", "1 c. à thé de sel"] });
  assert.equal(status, 200);
  assert.equal(body[0].unit, "cup");
  assert.equal(body[1].unit, "teaspoon");
  assert.equal(body[1].name, "sel");
});

test("POST /ingredients/parse with bad body -> 400", async () => {
  const { status } = await post("/ingredients/parse", { lines: "nope" });
  assert.equal(status, 400);
});

test("invalid JSON -> 400", async () => {
  const { status } = await json("/ingredients/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad",
  });
  assert.equal(status, 400);
});

test("POST /tiktok with a caption", async () => {
  const caption = "Quick Salad Ingredients: - 1 cucumber - 2 tomatoes - 1 tbsp olive oil";
  const { status, body } = await post("/tiktok", { caption });
  assert.equal(status, 200);
  assert.equal(body.found, true);
  assert.equal(body.title, "Quick Salad");
  assert.equal(body.ingredients.length, 3);
  assert.deepEqual(body.cost, { totalUsd: 0, complete: true, items: [] }); // rules only: nothing paid
});

test("POST /tiktok with nothing -> 400", async () => {
  const { status } = await post("/tiktok", {});
  assert.equal(status, 400);
});

test("GET /tiktok with a non-TikTok url", async () => {
  const { status, body } = await json("/tiktok?url=" + encodeURIComponent("https://example.com/x"));
  assert.equal(status, 200);
  assert.equal(body.found, false);
});

test("POST /video with an uploaded file -> transcript + AI", async () => {
  const { status, body } = await upload(
    "/video",
    { url: "https://www.instagram.com/reel/abc/" },
    { bytes: "fake mp4", type: "video/mp4", name: "reel.mp4" }
  );
  assert.equal(status, 200);
  assert.equal(body.found, true);
  assert.equal(body.extractionMethod, "ai-transcript");
  assert.equal(body.title, "Scrambled Eggs");
  assert.equal(body.siteName, "instagram.com");
  assert.equal(body.transcript, "two eggs, scrambled in butter");
  // 30 s of speech-to-text ($0.0015) + Claude: 2,000 in ($0.008) + 1,000 out ($0.02)
  assert.deepEqual(body.cost.items.map((i) => i.service), ["transcription", "claude"]);
  assert.equal(body.cost.totalUsd, 0.0295);
  assert.equal(body.cost.complete, true);
});

test("POST /tiktok with a messy caption -> AI on the caption", async () => {
  const { status, body } = await post("/tiktok", { caption: "the easiest breakfast 🍳 2 eggs + butter, 3 min #eggs" });
  assert.equal(status, 200);
  assert.equal(body.siteName, "TikTok");
  assert.equal(body.found, true);
  assert.equal(body.extractionMethod, "ai-caption");
  assert.equal(body.transcript, undefined);
  assert.equal(body.cost.totalUsd, 0.028);
});

test("POST /tiktok with a link only explains that the caption is needed", async () => {
  // a non-TikTok host is rejected before any network call
  const { body } = await post("/tiktok", { url: "https://www.youtube.com/watch?v=x" });
  assert.equal(body.found, false);
  assert.match(body.reason, /isn't a TikTok link/);
});

test("POST /video rejects non-video files", async () => {
  const { status, body } = await upload("/video", {}, { bytes: "%PDF", type: "application/pdf", name: "a.pdf" });
  assert.equal(status, 415);
  assert.match(body.error, /Unsupported file type/);
});

test("POST /video with nothing -> 400", async () => {
  const { status } = await upload("/video", {});
  assert.equal(status, 400);
});

test("unknown route -> 404", async () => {
  const { status } = await json("/nope");
  assert.equal(status, 404);
});
