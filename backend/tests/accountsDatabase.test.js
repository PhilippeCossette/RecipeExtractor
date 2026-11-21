import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setDb } from "../src/db/index.js";
import * as schema from "../src/db/schema/index.js";

// The real Better Auth + Drizzle + the real migration, on an in-memory Postgres (PGlite) instead of Neon.

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

/** Minimal cookie jar: keeps the session cookie Better Auth sets. */
let cookie = "";
const call = async (path, { method = "GET", body } = {}) => {
  const headers = { origin: "http://localhost:3001" };
  if (cookie) headers.cookie = cookie;
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookies = res.headers.getSetCookie();
  if (setCookies.length) cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const recipe = {
  found: true,
  title: "Pâté chinois",
  sourceUrl: "https://www.ricardocuisine.com/recettes/5541-pate-chinois",
  ingredients: ["450 g de bœuf haché", "1 oignon"],
  instructions: [{ section: null, text: "Cuire le bœuf." }],
};

test("sign up, use the session, save / list / get / delete a recipe, sign out", async () => {
  const signUp = await call("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Chef", email: "chef@example.com", password: "a-long-password" },
  });
  assert.equal(signUp.status, 200, JSON.stringify(signUp.body));
  assert.ok(cookie.includes("session_token"), "Better Auth set a session cookie");

  const me = await call("/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "chef@example.com");

  const saved = await call("/recipes", { method: "POST", body: { recipe } });
  assert.equal(saved.status, 201);
  const id = saved.body.recipe.id;

  const list = await call("/recipes");
  assert.deepEqual(list.body.recipes.map((r) => r.title), ["Pâté chinois"]);

  const one = await call(`/recipes/${id}`);
  assert.deepEqual(one.body.recipe.data.ingredients, recipe.ingredients);

  assert.equal((await call(`/recipes/${id}`, { method: "DELETE" })).status, 204);
  assert.equal((await call(`/recipes/${id}`)).status, 404);

  await call("/api/auth/sign-out", { method: "POST", body: {} });
  assert.equal((await call("/me")).status, 401);
});

test("sign in with the right password works, the wrong one doesn't", async () => {
  cookie = "";
  const wrong = await call("/api/auth/sign-in/email", { method: "POST", body: { email: "chef@example.com", password: "nope-nope-nope" } });
  assert.equal(wrong.status, 401);

  const right = await call("/api/auth/sign-in/email", { method: "POST", body: { email: "chef@example.com", password: "a-long-password" } });
  assert.equal(right.status, 200);
  assert.equal((await call("/me")).status, 200);
});

test("users only see their own recipes", async () => {
  // chef (signed in from the previous test) saves one
  const saved = await call("/recipes", { method: "POST", body: { recipe } });
  const chefsRecipe = saved.body.recipe.id;

  cookie = "";
  await call("/api/auth/sign-up/email", { method: "POST", body: { name: "Other", email: "other@example.com", password: "another-password" } });
  assert.deepEqual((await call("/recipes")).body.recipes, []);
  assert.equal((await call(`/recipes/${chefsRecipe}`)).status, 404);
  assert.equal((await call(`/recipes/${chefsRecipe}`, { method: "DELETE" })).status, 404);
});
