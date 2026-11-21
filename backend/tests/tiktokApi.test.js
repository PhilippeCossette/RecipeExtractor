import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { config } from "../src/config/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";
import { fetchTikTokVideo } from "../src/services/tiktok/provider/fetchTikTokVideo.js";
import { setTikTokProvider } from "../src/services/tiktok/provider/index.js";
import { extractTikTokRecipe } from "../src/services/tiktok/index.js";
import { setOpenAIClient } from "../src/services/transcription/openaiClient.js";
import { vttToText } from "../src/utils/index.js";

// Everything external is faked: TikTok API, video download, OpenAI, Claude. No network, no cost.
const LINK = "https://www.tiktok.com/@chef.jo/video/7300000000000000001?lang=en";
const CLEAN_LINK = "https://www.tiktok.com/@chef.jo/video/7300000000000000001";
const SUBTITLES = "Today we're making soup. Chop one onion, add two cups of broth, and simmer for twenty minutes.";
let calls;

const RECIPE = {
  isRecipe: true, title: "Spoken Soup", description: null, servings: 2, yield: null,
  prepMinutes: null, cookMinutes: 20, totalMinutes: null,
  ingredients: ["1 onion", "2 cups broth"], instructions: ["Simmer everything 20 minutes."], tips: [],
};

function apiReturns(overrides = {}) {
  return async (url) => {
    calls.push(`api ${url}`);
    return {
      caption: "you HAVE to try this 😭 #soup", username: "chef.jo", nickname: "Chef Jo",
      thumbnail: "https://cdn/cover.jpg", durationSeconds: 45, videoId: "7300000000000000001",
      videoUrl: "https://cdn/video.mp4", subtitles: null, ...overrides,
    };
  };
}

beforeEach(() => {
  calls = [];
  Object.assign(config.scrapeCreators, { enabled: true, apiKey: "test-key" });
  config.ai.enabled = true;
  config.transcription.enabled = true;
  config.transcription.ffmpegPath = "ffmpeg-not-installed-for-tests";
  setTikTokProvider({
    fetchVideo: apiReturns(),
    downloadVideo: async (u) => (calls.push(`download ${u}`), { buffer: Buffer.from("mp4"), filename: "tiktok.mp4" }),
  });
  setOpenAIClient({ audio: { transcriptions: { create: async () => (calls.push("speech-to-text"), { text: SUBTITLES }) } } });
  setAnthropicClient({
    beta: {
      messages: {
        parse: async (p) => {
          const withTranscript = p.messages[0].content.includes("<transcript>");
          calls.push(withTranscript ? "ai transcript" : "ai caption");
          return { stop_reason: "end_turn", parsed_output: withTranscript ? RECIPE : { ...RECIPE, isRecipe: false, ingredients: [] } };
        },
      },
    },
  });
});
afterEach(() => Object.assign(config.scrapeCreators, { enabled: false, apiKey: null }));

test("1. caption from the TikTok API has the recipe: rules only, nothing else called", async () => {
  setTikTokProvider({ fetchVideo: apiReturns({ caption: "Soup Ingredients: - 1 onion - 2 cups broth" }) });
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "caption");
  assert.equal(r.author, "Chef Jo");
  assert.equal(r.image, "https://cdn/cover.jpg");
  assert.equal(r.sourceUrl, CLEAN_LINK);
  assert.deepEqual(calls, [`api ${CLEAN_LINK}`]);
});

test("2. caption with no recipe -> AI caption skipped -> TikTok subtitles + AI (no download)", async () => {
  setTikTokProvider({ fetchVideo: apiReturns({ subtitles: SUBTITLES }) });
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.extractionMethod, "ai-transcript");
  assert.equal(r.transcriptSource, "tiktok-subtitles");
  assert.equal(r.transcript, SUBTITLES);
  assert.deepEqual(calls, [`api ${CLEAN_LINK}`, "ai transcript"]);
  assert.match(r.caption, /HAVE to try/);
});

test("3. no subtitles -> server downloads the video -> speech-to-text + AI", async () => {
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.found, true);
  assert.equal(r.title, "Spoken Soup");
  assert.equal(r.transcriptSource, "speech-to-text");
  assert.deepEqual(calls, [`api ${CLEAN_LINK}`, "download https://cdn/video.mp4", "speech-to-text", "ai transcript"]);
});

test("a caption with quantities still gets the AI caption step before the audio", async () => {
  setTikTokProvider({ fetchVideo: apiReturns({ caption: "lazy soup lol, 1 onion and 2 cups broth, 20 min", subtitles: SUBTITLES }) });
  await extractTikTokRecipe({ url: LINK });
  assert.deepEqual(calls, [`api ${CLEAN_LINK}`, "ai caption", "ai transcript"]);
});

test("a caption sent by the app overrides the API's caption", async () => {
  const r = await extractTikTokRecipe({ url: LINK, caption: "Soup Ingredients: - 1 onion - 2 cups broth" });
  assert.equal(r.extractionMethod, "caption");
});

test("too-short subtitles (just 'music') are ignored", async () => {
  setTikTokProvider({ fetchVideo: apiReturns({ subtitles: "[Music]" }) });
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.transcriptSource, "speech-to-text");
});

test("long videos aren't downloaded", async () => {
  setTikTokProvider({ fetchVideo: apiReturns({ durationSeconds: 3600 }) });
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.found, false);
  assert.match(r.reason, /longer than 10 minutes/);
  assert.equal(calls.some((c) => c.startsWith("download")), false);
});

test("download failure is reported, not thrown", async () => {
  setTikTokProvider({ downloadVideo: async () => { throw new Error("video download returned HTTP 403"); } });
  const r = await extractTikTokRecipe({ url: LINK });
  assert.equal(r.found, false);
  assert.match(r.reason, /Couldn't download the video: video download returned HTTP 403/);
});

test("TikTok API error -> warning, falls back to the app's caption", async () => {
  setTikTokProvider({ fetchVideo: async () => { throw new Error("the ScrapeCreators account is out of credits"); } });
  const r = await extractTikTokRecipe({ url: LINK, caption: "Soup Ingredients: - 1 onion - 2 cups broth" });
  assert.equal(r.found, true);
  assert.match(r.warnings[0], /out of credits/);
});

test("fetchTikTokVideo maps the ScrapeCreators response", async () => {
  const realFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url, init) => {
    requested = { url: String(url), key: init.headers["x-api-key"] };
    return new Response(JSON.stringify({
      success: true, credits_charged: 1,
      transcript: "WEBVTT\n\n00:00:00.140 --> 00:00:04.020\nChop one onion\n\n00:00:04.020 --> 00:00:06.000\nChop one onion\nadd <i>broth</i>",
      aweme_detail: {
        aweme_id: "7300000000000000001", desc: "Soup night 🍲",
        author: { unique_id: "chef.jo", nickname: "Chef Jo" },
        video: {
          duration: 45200, has_watermark: true,
          cover: { url_list: ["https://cdn/cover.heic?x=1", "https://cdn/cover.heic?x=2", "https://cdn/cover.jpg"] }, // TikTok order: heic first
          download_no_watermark_addr: { url_list: ["https://cdn/nowm.mp4"] },
          play_addr: { url_list: ["https://cdn/play.mp4"] },
          download_addr: { url_list: ["https://cdn/wm.mp4"] },
          bit_rate: [
            { gear_name: "adapt_lowest_1080_1", bit_rate: 1247314, play_addr: { data_size: 21214798, url_list: ["https://cdn/1080.mp4"] } },
            { gear_name: "lowest_540_1", bit_rate: 288731, play_addr: { data_size: 4910856, url_list: ["https://cdn/540.mp4"] } },
          ],
        },
      },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const v = await fetchTikTokVideo(CLEAN_LINK);
    assert.match(requested.url, /^https:\/\/api\.scrapecreators\.com\/v2\/tiktok\/video\?/);
    assert.match(requested.url, /get_transcript=true/);
    assert.equal(requested.key, "test-key");
    assert.deepEqual(v, {
      caption: "Soup night 🍲", username: "chef.jo", nickname: "Chef Jo", thumbnail: "https://cdn/cover.jpg",
      durationSeconds: 45, videoId: "7300000000000000001", videoUrl: "https://cdn/nowm.mp4",
      smallVideoUrl: "https://cdn/540.mp4", subtitles: "Chop one onion add broth",
    });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("fetchTikTokVideo turns HTTP errors into readable messages", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 402 });
  try {
    await assert.rejects(fetchTikTokVideo(CLEAN_LINK), /out of credits/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("vttToText", () => {
  assert.equal(vttToText("WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHello\n\n2\n00:00:02.000 --> 00:00:03.000\nworld"), "Hello world");
  assert.equal(vttToText(null), "");
});
