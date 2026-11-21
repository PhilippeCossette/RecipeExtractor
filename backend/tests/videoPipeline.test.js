import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { config } from "../src/config/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";
import { setOpenAIClient } from "../src/services/transcription/openaiClient.js";
import { recipeFromSources } from "../src/services/video/index.js";

// Fake clients: no network, no cost. Each records what it was sent.
let aiCalls;
let transcribeCalls;
let aiAnswer;

const fakeAnthropic = {
  beta: {
    messages: {
      parse: async (params) => {
        aiCalls.push(params);
        return { stop_reason: "end_turn", parsed_output: aiAnswer };
      },
    },
  },
};
const fakeOpenAI = {
  audio: {
    transcriptions: {
      create: async (params) => {
        transcribeCalls.push(params);
        return { text: "Okay so take two cups of rice, rinse it, then cook it with three cups of water for 18 minutes." };
      },
    },
  },
};

const RICE = {
  isRecipe: true,
  title: "Perfect Rice",
  description: null,
  servings: 4,
  yield: null,
  prepMinutes: 2,
  cookMinutes: 18,
  totalMinutes: null,
  ingredients: ["2 cups rice", "3 cups water"],
  instructions: ["Rinse the rice.", "Cook with the water for 18 minutes."],
  tips: [],
};
const VIDEO = { buffer: Buffer.from("fake video bytes"), filename: "clip.mp4" };

beforeEach(() => {
  aiCalls = [];
  transcribeCalls = [];
  aiAnswer = RICE;
  config.ai.enabled = true;
  config.transcription.enabled = true;
  config.transcription.ffmpegPath = "ffmpeg-not-installed-for-tests"; // send the file as-is
  setAnthropicClient(fakeAnthropic);
  setOpenAIClient(fakeOpenAI);
});

test("1. a well-formatted caption is parsed by rules: no AI, no transcription", async () => {
  const r = await recipeFromSources({ caption: "Rice Ingredients: - 2 cups rice - 3 cups water", file: VIDEO });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "caption");
  assert.equal(aiCalls.length, 0);
  assert.equal(transcribeCalls.length, 0);
});

test("2. a messy caption goes to AI", async () => {
  const caption = "made rice today, just 2 cups rice + 3 cups water, 18 min, so easy #rice";
  const r = await recipeFromSources({ caption });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "ai-caption");
  assert.equal(r.title, "Perfect Rice");
  assert.deepEqual(r.timesMinutes, { prep: 2, cook: 18, total: 20 });
  assert.equal(r.ingredientsParsed[0].unit, "cup");
  assert.deepEqual(r.keywords, ["rice"]);
  assert.equal(transcribeCalls.length, 0);

  const sent = aiCalls[0];
  assert.equal(sent.model, config.ai.model);
  assert.equal(sent.fallbacks, "default");
  assert.match(sent.messages[0].content, /<caption>[\s\S]*made rice today/);
  assert.match(sent.system, /untrusted/);
});

test("3. no recipe in the caption -> transcribe the video -> AI reads caption + transcript", async () => {
  aiAnswer = null; // first AI call (caption only) finds nothing...
  let call = 0;
  setAnthropicClient({
    beta: {
      messages: {
        parse: async (params) => {
          aiCalls.push(params);
          call++;
          return { stop_reason: "end_turn", parsed_output: call === 1 ? { ...RICE, isRecipe: false, ingredients: [] } : RICE };
        },
      },
    },
  });

  // has a number, so the AI caption step runs (and finds nothing) before the transcript
  const r = await recipeFromSources({ caption: "my rice method, 2 tricks you need 😭 #fyp", file: VIDEO });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "ai-transcript");
  assert.match(r.transcript, /two cups of rice/);
  assert.equal(transcribeCalls.length, 1);
  assert.equal(transcribeCalls[0].model, config.transcription.model);
  assert.match(aiCalls[1].messages[0].content, /<transcript>[\s\S]*two cups of rice/);
});

test("caption with no recipe + video: skips the AI caption call and goes straight to the transcript", async () => {
  const r = await recipeFromSources({ caption: "watch till the end 😭 #fyp", file: VIDEO });
  assert.equal(r.extractionMethod, "ai-transcript");
  assert.equal(aiCalls.length, 1);
  assert.match(aiCalls[0].messages[0].content, /<transcript>/);
});

test("caption with no recipe and no video: AI still gets a chance", async () => {
  aiAnswer = { ...RICE, isRecipe: false, ingredients: [] };
  const r = await recipeFromSources({ caption: "watch till the end 😭 #fyp" });
  assert.equal(r.found, false);
  assert.equal(aiCalls.length, 1);
});

test("no caption, video only", async () => {
  const r = await recipeFromSources({ file: VIDEO });
  assert.equal(r.extractionMethod, "ai-transcript");
  assert.equal(aiCalls.length, 1);
  assert.doesNotMatch(aiCalls[0].messages[0].content, /<caption>/);
});

test("AI off: explains what's missing", async () => {
  config.ai.enabled = false;
  const r = await recipeFromSources({ caption: "so good #fyp" });
  assert.equal(r.found, false);
  assert.deepEqual(r.attempts.map((a) => a.method), ["caption", "ai-caption", "ai-transcript"]);
  assert.match(r.attempts[1].reason, /ANTHROPIC_API_KEY/);
  assert.match(r.reason, /No video file/);
});

test("unsupported file without ffmpeg", async () => {
  const r = await recipeFromSources({ file: { buffer: Buffer.from("x"), filename: "screen.mov" } });
  assert.equal(r.found, false);
  assert.match(r.reason, /\.mov files need ffmpeg/);
  assert.equal(transcribeCalls.length, 0);
});

test("AI refusal is reported, not thrown", async () => {
  setAnthropicClient({ beta: { messages: { parse: async () => ({ stop_reason: "refusal", parsed_output: null }) } } });
  const r = await recipeFromSources({ caption: "messy caption with no headings" });
  assert.equal(r.found, false);
  assert.match(r.attempts[1].reason, /declined/);
});
