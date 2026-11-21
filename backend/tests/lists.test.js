import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setDb } from "../src/db/index.js";
import * as schema from "../src/db/schema/index.js";
import { listPermissions } from "../src/services/lists/index.js";

// Lists on the real migrations (in-memory Postgres) with real Better Auth.

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
  return { status: res.status, body: text ? JSON.parse(text) : null };
};
const signUp = (who) =>
  call(who, "/api/auth/sign-up/email", { method: "POST", body: { name: who, email: `${who}@example.com`, password: "a-long-password" } });
const saveRecipe = async (who, title, sourceUrl, image = null) =>
  (await call(who, "/recipes", {
    method: "POST",
    body: { recipe: { found: true, platform: "website", title, sourceUrl, image, ingredients: ["1 thing"], instructions: [] } },
  })).body.recipe.id;

let asianId;
let quickId;
let pho;
let padThai;

test("create lists; names are unique per user, ignoring letter case", async () => {
  await signUp("mia");
  const asian = await call("mia", "/lists", { method: "POST", body: { name: "  Asian ", description: "Weeknight noodles" } });
  assert.equal(asian.status, 201);
  assert.equal(asian.body.list.name, "Asian"); // trimmed
  assert.equal(asian.body.list.visibility, "private");
  asianId = asian.body.list.id;

  quickId = (await call("mia", "/lists", { method: "POST", body: { name: "Quick" } })).body.list.id;

  const dup = await call("mia", "/lists", { method: "POST", body: { name: "asian" } });
  assert.equal(dup.status, 409);
  assert.match(dup.body.error, /already have a list/);

  assert.equal((await call("mia", "/lists", { method: "POST", body: { name: "" } })).status, 400);
  assert.equal((await call("mia", "/lists", { method: "POST", body: { name: "x".repeat(51) } })).status, 400);
});

test("add recipes to lists; adding twice changes nothing; one recipe in several lists", async () => {
  pho = await saveRecipe("mia", "Pho", "https://site.com/pho", "https://cdn/pho.jpg");
  padThai = await saveRecipe("mia", "Pad Thai", "https://site.com/pad-thai");

  assert.equal((await call("mia", `/lists/${asianId}/recipes/${pho}`, { method: "PUT" })).status, 201);
  assert.equal((await call("mia", `/lists/${asianId}/recipes/${pho}`, { method: "PUT" })).status, 200); // already there
  await call("mia", `/lists/${asianId}/recipes/${padThai}`, { method: "PUT" });
  await call("mia", `/lists/${quickId}/recipes/${pho}`, { method: "PUT" });

  const asian = await call("mia", `/lists/${asianId}`);
  assert.deepEqual(asian.body.list.recipes.map((r) => r.title).sort(), ["Pad Thai", "Pho"]);
  assert.deepEqual(asian.body.list.permissions, { edit: true, isOwner: true });
  assert.equal(asian.body.list.shareId, undefined); // not exposed until sharing exists

  const lists = (await call("mia", "/lists")).body.lists;
  assert.deepEqual(lists.map((l) => [l.name, l.recipeCount]), [["Asian", 2], ["Quick", 1]]);
  assert.equal(lists[0].coverImage, "https://cdn/pho.jpg");

  // The recipe page knows its lists
  const recipe = await call("mia", `/recipes/${pho}`);
  assert.deepEqual(recipe.body.recipe.lists.map((l) => l.name), ["Asian", "Quick"]);
});

test("rename and describe a list; renaming onto another list's name is refused", async () => {
  const renamed = await call("mia", `/lists/${quickId}`, { method: "PATCH", body: { name: "Under 20 min" } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.list.name, "Under 20 min");

  const cleared = await call("mia", `/lists/${quickId}`, { method: "PATCH", body: { description: "" } });
  assert.equal(cleared.body.list.description, null);

  assert.equal((await call("mia", `/lists/${quickId}`, { method: "PATCH", body: { name: "ASIAN" } })).status, 409);
  assert.equal((await call("mia", `/lists/${quickId}`, { method: "PATCH", body: {} })).status, 400);
});

test("other users can't see, change, or add to someone's list (404)", async () => {
  await signUp("leo");
  const leosRecipe = await saveRecipe("leo", "Leo's curry", "https://site.com/curry");
  assert.equal((await call("leo", `/lists/${asianId}`)).status, 404);
  assert.equal((await call("leo", `/lists/${asianId}`, { method: "PATCH", body: { name: "mine" } })).status, 404);
  assert.equal((await call("leo", `/lists/${asianId}`, { method: "DELETE" })).status, 404);
  assert.equal((await call("leo", `/lists/${asianId}/recipes/${leosRecipe}`, { method: "PUT" })).status, 404);
  assert.deepEqual((await call("leo", "/lists")).body.lists, []);

  // ...and mia can't put leo's recipe in her list
  assert.equal((await call("mia", `/lists/${asianId}/recipes/${leosRecipe}`, { method: "PUT" })).status, 404);
  // the same list name is fine for another user
  assert.equal((await call("leo", "/lists", { method: "POST", body: { name: "Asian" } })).status, 201);
});

test("remove from a list; deleting a recipe or a list cleans up links only", async () => {
  assert.equal((await call("mia", `/lists/${asianId}/recipes/${padThai}`, { method: "DELETE" })).status, 204);
  assert.deepEqual((await call("mia", `/lists/${asianId}`)).body.list.recipes.map((r) => r.title), ["Pho"]);

  // Deleting the recipe removes it from every list
  await call("mia", `/recipes/${pho}`, { method: "DELETE" });
  const lists = (await call("mia", "/lists")).body.lists;
  assert.deepEqual(lists.map((l) => l.recipeCount), [0, 0]);

  // Deleting a list keeps the recipes
  const padThaiStill = await saveRecipe("mia", "Pad Thai", "https://site.com/pad-thai"); // same id (no duplicates)
  assert.equal(padThaiStill, padThai);
  await call("mia", `/lists/${asianId}/recipes/${padThai}`, { method: "PUT" });
  assert.equal((await call("mia", `/lists/${asianId}`, { method: "DELETE" })).status, 204);
  assert.equal((await call("mia", `/lists/${asianId}`)).status, 404);
  assert.equal((await call("mia", `/recipes/${padThai}`)).status, 200);
});

test("signed out -> 401; bad ids -> 400", async () => {
  assert.equal((await call("nobody", "/lists")).status, 401);
  assert.equal((await call("mia", "/lists/not-a-uuid")).status, 400);
});

test("listPermissions: only the owner, for now", () => {
  const list = { ownerId: "u1", visibility: "private" };
  assert.deepEqual(listPermissions(list, "u1"), { view: true, edit: true, isOwner: true });
  assert.deepEqual(listPermissions(list, "u2"), { view: false, edit: false, isOwner: false });
  assert.deepEqual(listPermissions(list, null), { view: false, edit: false, isOwner: false });
});
