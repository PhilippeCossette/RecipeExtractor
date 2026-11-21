import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setDb } from "../src/db/index.js";
import { setAuth } from "../src/services/auth/index.js";

// Fake Better Auth: the cookie "session=ok" is a signed-in user, anything else is signed out.
const fakeUser = { id: "user_1", name: "Chef", email: "chef@example.com", emailVerified: false, image: null, createdAt: new Date(0) };
const fakeAuth = {
  api: {
    getSession: async ({ headers }) =>
      headers.get("cookie")?.includes("session=ok") ? { user: fakeUser, session: { expiresAt: new Date(0) } } : null,
  },
};

// Fake Drizzle: just enough for saveRecipe (insert().values().onConflictDoNothing().returning()).
let inserted = null;
const fakeDb = {
  insert: () => ({
    values: (row) => ({
      onConflictDoNothing: () => ({
        returning: async () => {
          inserted = row;
          return [{ id: "11111111-1111-4111-8111-111111111111", createdAt: new Date(0), ...row }];
        },
      }),
    }),
  }),
};

config.costLog.enabled = false;
let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (path, { cookie, method = "GET", body, origin } = {}) => {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
};

const goodRecipe = {
  found: true,
  title: "Pâté chinois",
  sourceUrl: "https://www.ricardocuisine.com/recettes/5541-pate-chinois",
  siteName: "ricardocuisine.com",
  image: null,
  ingredients: ["450 g de bœuf haché", "1 oignon"],
  instructions: [{ section: null, text: "Cuire le bœuf." }],
  cost: { totalUsd: 0, complete: true, items: [] },
};

// --- Without a database ---

test("without a database, accounts answer 503", async () => {
  setAuth(null);
  assert.equal((await call("/me")).status, 503);
  assert.equal((await call("/recipes")).status, 503);
  assert.equal((await call("/api/auth/get-session")).status, 503);
});

// --- With (fake) accounts ---

test("signed out -> 401", async () => {
  setAuth(fakeAuth);
  const { status, body } = await call("/recipes");
  assert.equal(status, 401);
  assert.match(body.error, /Sign in/);
});

test("GET /me returns the signed-in user", async () => {
  setAuth(fakeAuth);
  const { status, body } = await call("/me", { cookie: "session=ok" });
  assert.equal(status, 200);
  assert.equal(body.user.email, "chef@example.com");
});

test("POST /recipes rejects a recipe with no ingredients (zod)", async () => {
  setAuth(fakeAuth);
  const { status, body } = await call("/recipes", {
    cookie: "session=ok",
    method: "POST",
    body: { recipe: { ...goodRecipe, ingredients: [] } },
  });
  assert.equal(status, 400);
  assert.ok(body.issues.some((i) => i.path === "recipe.ingredients"));
});

test("POST /recipes rejects a not-found result", async () => {
  setAuth(fakeAuth);
  const { status } = await call("/recipes", { cookie: "session=ok", method: "POST", body: { recipe: { found: false } } });
  assert.equal(status, 400);
});

test("POST /recipes saves for the signed-in user, without per-request fields", async () => {
  setAuth(fakeAuth);
  setDb(fakeDb);
  const { status, body } = await call("/recipes", { cookie: "session=ok", method: "POST", body: { recipe: goodRecipe } });
  assert.equal(status, 201);
  assert.equal(body.recipe.title, "Pâté chinois");
  assert.equal(inserted.userId, "user_1");
  assert.equal(inserted.data.cost, undefined); // the request's cost isn't stored
  assert.deepEqual(inserted.data.ingredients, goodRecipe.ingredients);
});

test("GET /recipes/:id with a bad id -> 400", async () => {
  setAuth(fakeAuth);
  const { status } = await call("/recipes/not-a-uuid", { cookie: "session=ok" });
  assert.equal(status, 400);
});

test("GET /recipes with a bad limit -> 400", async () => {
  setAuth(fakeAuth);
  const { status } = await call("/recipes?limit=1000", { cookie: "session=ok" });
  assert.equal(status, 400);
});

// --- CORS ---

test("the frontend origin may send cookies; other origins may not", async () => {
  const app = await call("/health", { origin: "http://localhost:3001" });
  assert.equal(app.headers.get("access-control-allow-origin"), "http://localhost:3001");
  assert.equal(app.headers.get("access-control-allow-credentials"), "true");

  const other = await call("/health", { origin: "https://evil.example" });
  assert.equal(other.headers.get("access-control-allow-origin"), "*");
  assert.equal(other.headers.get("access-control-allow-credentials"), null);
});
