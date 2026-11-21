import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setDb } from "../src/db/index.js";
import * as schema from "../src/db/schema/index.js";
import { sourceKeyForRecipe, sourceKeyFromUrl } from "../src/services/recipes/index.js";
import { setYouTubeProvider } from "../src/services/youtube/index.js";
import { canonicalUrl } from "../src/utils/index.js";

// --- Keys ---

test("canonicalUrl ignores www, https, #, tracking params, param order and a trailing slash", () => {
  const same = [
    "https://www.ricardocuisine.com/recettes/5541-pate-chinois/",
    "http://ricardocuisine.com/recettes/5541-pate-chinois",
    "https://WWW.RicardoCuisine.com/recettes/5541-pate-chinois?utm_source=insta&fbclid=abc#comments",
  ].map(canonicalUrl);
  assert.equal(new Set(same).size, 1);
  assert.equal(same[0], "ricardocuisine.com/recettes/5541-pate-chinois");
  assert.equal(canonicalUrl("https://site.com/r?b=2&a=1"), "site.com/r?a=1&b=2"); // real params are kept
  assert.notEqual(canonicalUrl("https://site.com/r?id=1"), canonicalUrl("https://site.com/r?id=2"));
});

test("sourceKeyFromUrl: one key per post, whatever the link looks like", () => {
  const yt = ["https://youtu.be/abcdefghijk?si=x", "https://www.youtube.com/shorts/abcdefghijk", "m.youtube.com/watch?v=abcdefghijk"];
  for (const link of yt) assert.equal(sourceKeyFromUrl(link.startsWith("http") ? link : `https://${link}`), "youtube:abcdefghijk");
  assert.equal(sourceKeyFromUrl("https://www.instagram.com/reels/ABC123/?igsh=x"), "instagram:ABC123");
  assert.equal(sourceKeyFromUrl("https://www.tiktok.com/@chef/video/7300000000000000001?lang=en"), "tiktok:7300000000000000001");
  assert.equal(sourceKeyFromUrl("https://vm.tiktok.com/ZMabc/"), null); // short link: unknown until resolved
  assert.equal(sourceKeyFromUrl("https://www.site.com/r/?utm_campaign=x"), "web:site.com/r");
});

test("sourceKeyForRecipe prefers the platform's own id", () => {
  assert.equal(sourceKeyForRecipe({ platform: "tiktok", videoId: "123", sourceUrl: "https://vm.tiktok.com/x/" }), "tiktok:123");
  assert.equal(sourceKeyForRecipe({ siteName: "Instagram", videoId: "ABC", sourceUrl: "https://www.instagram.com/reel/ABC/" }), "instagram:ABC");
  assert.equal(sourceKeyForRecipe({ platform: "website", sourceUrl: "https://www.site.com/r/" }), "web:site.com/r");
  assert.equal(sourceKeyForRecipe({ title: "no source" }), null);
});

// --- Saving twice, on a real (in-memory) Postgres with real Better Auth ---

config.costLog.enabled = false;
config.auth.secret = "test-secret-test-secret-test-secret-123";
let server;
let base;
let pg;

before(async () => {
  pg = new PGlite();
  for (const file of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) await pg.exec(statement);
    }
  }
  setDb(drizzle({ client: pg, schema }));
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  config.auth.baseUrl = base;
});
after(async () => {
  server.close();
  await pg.close();
});

const jars = {};
const call = async (who, path, { method = "GET", body } = {}) => {
  const headers = { origin: "http://localhost:3001" };
  if (jars[who]) headers.cookie = jars[who];
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookies = res.headers.getSetCookie();
  if (setCookies.length) jars[who] = setCookies.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  return { status: res.status, text, body: text && !text.includes("\n{") ? JSON.parse(text) : null };
};
const signUp = (who) =>
  call(who, "/api/auth/sign-up/email", { method: "POST", body: { name: who, email: `${who}@example.com`, password: "a-long-password" } });

const shortRecipe = (sourceUrl) => ({
  found: true,
  platform: "youtube",
  siteName: "YouTube",
  videoId: "abcdefghijk",
  title: "Garlic Noodles",
  sourceUrl,
  ingredients: ["200 g noodles", "4 garlic cloves"],
  instructions: [{ section: null, text: "Cook." }],
});

test("saving the same post twice returns the first one", async () => {
  await signUp("ana");
  const first = await call("ana", "/recipes", { method: "POST", body: { recipe: shortRecipe("https://www.youtube.com/shorts/abcdefghijk") } });
  assert.equal(first.status, 201);
  assert.equal(first.body.alreadySaved, false);

  // Same Short through another link
  const again = await call("ana", "/recipes", { method: "POST", body: { recipe: shortRecipe("https://youtu.be/abcdefghijk") } });
  assert.equal(again.status, 200);
  assert.equal(again.body.alreadySaved, true);
  assert.equal(again.body.recipe.id, first.body.recipe.id);

  const list = await call("ana", "/recipes");
  assert.equal(list.body.recipes.length, 1);
});

test("two saves at the same moment still make one recipe", async () => {
  const site = { found: true, platform: "website", title: "Pâté chinois", ingredients: ["1 lb beef"], instructions: [] };
  const results = await Promise.all([
    call("ana", "/recipes", { method: "POST", body: { recipe: { ...site, sourceUrl: "https://www.ricardocuisine.com/recettes/5541/" } } }),
    call("ana", "/recipes", { method: "POST", body: { recipe: { ...site, sourceUrl: "https://ricardocuisine.com/recettes/5541?utm_source=x" } } }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.equal(results[0].body.recipe.id, results[1].body.recipe.id);
});

test("another user can save the same post", async () => {
  await signUp("ben");
  const res = await call("ben", "/recipes", { method: "POST", body: { recipe: shortRecipe("https://www.youtube.com/shorts/abcdefghijk") } });
  assert.equal(res.status, 201);
});

test("/recipe/stream opens an already saved link without extracting it again", async () => {
  let apiCalls = 0;
  Object.assign(config.scrapeCreators, { enabled: true, apiKey: "test-key" });
  setYouTubeProvider({ fetchVideo: async () => { apiCalls++; return {}; }, fetchTranscript: async () => { apiCalls++; return null; } });

  const res = await call("ana", "/recipe/stream", { method: "POST", body: { url: "https://m.youtube.com/watch?v=abcdefghijk&t=3" } });
  const events = res.text.trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(events.map((e) => e.step ?? e.type), ["check-link", "already-saved", "existing"]);
  assert.equal(events.at(-1).recipe.title, "Garlic Noodles");
  assert.equal(apiCalls, 0); // nothing paid

  Object.assign(config.scrapeCreators, { enabled: false, apiKey: null });
});
