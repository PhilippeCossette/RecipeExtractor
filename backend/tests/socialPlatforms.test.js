import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { config } from "../src/config/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";
import { extractInstagramRecipe, parseInstagramUrl, setInstagramProvider } from "../src/services/instagram/index.js";
import { extractYouTubeRecipe, parseYouTubeUrl, setYouTubeProvider } from "../src/services/youtube/index.js";

// --- Link parsing ---

test("parseInstagramUrl: reels, posts, with a username, without https", () => {
  assert.deepEqual(parseInstagramUrl("https://www.instagram.com/reel/DF5s0duxDts/?igsh=abc"), {
    url: "https://www.instagram.com/reel/DF5s0duxDts/",
    shortcode: "DF5s0duxDts",
    isReel: true,
  });
  assert.equal(parseInstagramUrl("instagram.com/reels/ABC123/").url, "https://www.instagram.com/reel/ABC123/");
  assert.equal(parseInstagramUrl("https://instagram.com/p/XYZ_9-/").url, "https://www.instagram.com/p/XYZ_9-/");
  assert.equal(parseInstagramUrl("https://www.instagram.com/chef.jo/reel/ABC123/").shortcode, "ABC123");
});

test("parseInstagramUrl rejects profiles and other sites", () => {
  assert.throws(() => parseInstagramUrl("https://www.instagram.com/chef.jo/"), /Not an Instagram link/);
  assert.throws(() => parseInstagramUrl("https://example.com/reel/ABC/"), /Not an Instagram link/);
});

test("parseYouTubeUrl: shorts, watch, youtu.be, mobile", () => {
  assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/shorts/abcdefghijk?feature=share"), {
    url: "https://www.youtube.com/shorts/abcdefghijk",
    videoId: "abcdefghijk",
    isShort: true,
  });
  assert.equal(parseYouTubeUrl("https://youtu.be/abcdefghijk?si=x").url, "https://www.youtube.com/watch?v=abcdefghijk");
  assert.equal(parseYouTubeUrl("m.youtube.com/watch?v=abcdefghijk&t=10").videoId, "abcdefghijk");
});

test("parseYouTubeUrl rejects channels and other sites", () => {
  assert.throws(() => parseYouTubeUrl("https://www.youtube.com/@chef"), /Not a YouTube link/);
  assert.throws(() => parseYouTubeUrl("https://vimeo.com/123"), /Not a YouTube link/);
});

// --- Extraction with fake APIs ---

const aiRecipe = {
  isRecipe: true, title: "Garlic Butter Shrimp", description: null, servings: 2, yield: null,
  prepMinutes: null, cookMinutes: 5, totalMinutes: null,
  ingredients: ["300 g shrimp", "2 tbsp butter", "3 garlic cloves"], instructions: ["Cook it all in a pan."], tips: [],
};
let aiInputs = [];

beforeEach(() => {
  aiInputs = [];
  Object.assign(config.scrapeCreators, { enabled: true, apiKey: "test-key" });
  config.ai.enabled = true;
  setAnthropicClient({
    beta: { messages: { parse: async (req) => { aiInputs.push(req.messages[0].content); return { stop_reason: "end_turn", parsed_output: aiRecipe }; } } },
  });
});
afterEach(() => Object.assign(config.scrapeCreators, { enabled: false, apiKey: null }));

test("Instagram: a caption with the recipe is parsed without AI or transcript", async () => {
  let transcriptCalls = 0;
  setInstagramProvider({
    fetchPost: async () => ({
      caption: "Easy Pancakes\nIngredients:\n- 1 cup flour\n- 1 egg\n- 1 cup milk\nSteps:\n1. Mix.\n2. Cook.",
      username: "chef.jo", fullName: "Chef Jo", thumbnail: "https://cdn/ig.jpg", durationSeconds: 30,
      shortcode: "ABC123", isVideo: true, videoUrl: "https://cdn/ig.mp4",
    }),
    fetchTranscript: async () => { transcriptCalls++; return null; },
  });
  const r = await extractInstagramRecipe({ url: "https://www.instagram.com/reel/ABC123/" });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "caption");
  assert.equal(r.siteName, "Instagram");
  assert.equal(r.author, "Chef Jo");
  assert.equal(r.image, "https://cdn/ig.jpg");
  assert.equal(transcriptCalls, 0);
});

test("Instagram: no recipe in the caption -> ScrapeCreators transcript -> AI", async () => {
  setInstagramProvider({
    fetchPost: async () => ({ caption: "the best dinner ever 🔥 #shrimp", username: "chef.jo", isVideo: true, videoUrl: "https://cdn/ig.mp4" }),
    fetchTranscript: async () => "Melt two tablespoons of butter, add three garlic cloves and 300 grams of shrimp, cook five minutes.",
  });
  const r = await extractInstagramRecipe({ url: "https://www.instagram.com/reel/ABC123/" });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "ai-transcript");
  assert.equal(r.transcriptSource, "instagram-transcript");
  assert.match(aiInputs.at(-1), /Melt two tablespoons/);
});

test("Instagram: not an Instagram link", async () => {
  const r = await extractInstagramRecipe({ url: "https://www.tiktok.com/@a/video/1" });
  assert.equal(r.found, false);
  assert.match(r.reason, /isn't an Instagram/);
});

test("YouTube: recipe in the description, title used as the name", async () => {
  let transcriptCalls = 0;
  setYouTubeProvider({
    fetchVideo: async () => ({
      title: "15-Minute Garlic Noodles #shorts",
      description: "Ingredients:\n- 200 g noodles\n- 4 garlic cloves\n- 2 tbsp butter\nCook the noodles, fry the garlic in butter, toss.",
      author: "Chef Jo", handle: "chefjo", thumbnail: "https://img.youtube.com/vi/abcdefghijk/maxresdefault.jpg", durationSeconds: 45,
    }),
    fetchTranscript: async () => { transcriptCalls++; return null; },
  });
  const r = await extractYouTubeRecipe({ url: "https://www.youtube.com/shorts/abcdefghijk" });
  assert.equal(r.found, true);
  assert.equal(r.siteName, "YouTube");
  assert.equal(r.sourceUrl, "https://www.youtube.com/shorts/abcdefghijk");
  assert.ok(r.ingredients.length >= 3);
  assert.equal(transcriptCalls, 0);
});

test("YouTube: no recipe in the description -> captions -> AI", async () => {
  setYouTubeProvider({
    fetchVideo: async () => ({ title: "best shrimp ever", description: null, author: "Chef Jo" }),
    fetchTranscript: async () => "today we melt two tablespoons of butter, add garlic and 300 grams of shrimp and cook for five minutes",
  });
  const r = await extractYouTubeRecipe({ url: "https://youtu.be/abcdefghijk" });
  assert.equal(r.found, true);
  assert.equal(r.transcriptSource, "youtube-captions");
});

test("YouTube: no description recipe and no captions -> clear reason, no download", async () => {
  setYouTubeProvider({
    fetchVideo: async () => ({ title: "vibes", description: null }),
    fetchTranscript: async () => null,
  });
  const r = await extractYouTubeRecipe({ url: "https://www.youtube.com/shorts/abcdefghijk" });
  assert.equal(r.found, false);
  assert.match(r.reason, /no captions/);
});
