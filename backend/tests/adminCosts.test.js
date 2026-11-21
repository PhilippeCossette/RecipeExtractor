import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { setDb } from "../src/db/index.js";
import * as schema from "../src/db/schema/index.js";
import { setAnthropicClient } from "../src/services/ai/anthropicClient.js";

// Real Better Auth + the real migrations on an in-memory Postgres; a fake Claude that reports token usage.

config.costLog.file = null; // no logs/costs.jsonl from tests
config.costLog.enabled = false;
config.auth.secret = "test-secret-test-secret-test-secret-123";
config.ai.enabled = true;
setAnthropicClient({
  beta: {
    messages: {
      parse: async () => ({
        stop_reason: "end_turn",
        model: "claude-opus-5-5",
        usage: { input_tokens: 2000, output_tokens: 1000 }, // $0.008 + $0.02 = $0.028
        parsed_output: {
          isRecipe: true, title: "Eggs", description: null, servings: 1, yield: null,
          prepMinutes: null, cookMinutes: 3, totalMinutes: null,
          ingredients: ["2 eggs", "1 tbsp butter"], instructions: ["Scramble."], tips: [],
        },
      }),
    },
  },
});

let server;
let base;
let pg;
let db;

before(async () => {
  pg = new PGlite();
  for (const file of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) await pg.exec(statement);
    }
  }
  db = drizzle({ client: pg, schema });
  setDb(db);
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
const signUp = (who, email) =>
  call(who, "/api/auth/sign-up/email", { method: "POST", body: { name: who, email, password: "a-long-password" } });

const waitForRows = async (n) => {
  for (let i = 0; i < 50; i++) {
    const rows = await db.select().from(schema.apiRequest);
    if (rows.length >= n) return rows;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("cost rows were not saved");
};

test("users can't set their own role at sign-up", async () => {
  const res = await call("sneaky", "/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Sneaky", email: "sneaky@example.com", password: "a-long-password", role: "admin" },
  });
  const [row] = await db.select().from(schema.user).where(eq(schema.user.email, "sneaky@example.com"));
  assert.ok(res.status === 200 || res.status === 400, `status ${res.status}`);
  if (row) assert.equal(row.role, "user");
});

test("each recipe request is stored with its cost and user", async () => {
  await signUp("cook", "cook@example.com");
  // A messy caption: rules fail, so Claude runs ($0.028)
  const res = await call("cook", "/tiktok", { method: "POST", body: { caption: "best eggs ever 2 eggs + butter 3 min" } });
  assert.equal(res.body.cost.totalUsd, 0.028);

  const [row] = await waitForRows(1);
  assert.equal(row.path, "/tiktok");
  assert.equal(row.totalUsd, 0.028);
  assert.equal(row.items[0].service, "claude");
  const [cook] = await db.select().from(schema.user).where(eq(schema.user.email, "cook@example.com"));
  assert.equal(row.userId, cook.id);
});

test("normal users get 403 on /admin", async () => {
  assert.equal((await call("cook", "/admin/costs/summary")).status, 403);
  assert.equal((await call("nobody", "/admin/costs/summary")).status, 401);
});

test("admins see totals by service, route, day and user, and the request list", async () => {
  await signUp("boss", "boss@example.com");
  await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.email, "boss@example.com"));

  // A free request from a signed-out client
  await call("anon", "/tiktok", { method: "POST", body: { caption: "Salad\nIngredients:\n- 1 cucumber\n- 2 tomatoes" } });
  await waitForRows(2);

  const { status, body } = await call("boss", "/admin/costs/summary?days=7");
  assert.equal(status, 200);
  assert.equal(body.totalUsd, 0.028);
  assert.equal(body.requests, 2);
  assert.equal(body.paidRequests, 1);
  assert.deepEqual(body.byService.map((s) => [s.service, s.model, s.calls, s.usd]), [["claude", "claude-opus-5-5", 1, 0.028]]);
  assert.equal(body.byService[0].inputTokens, 2000);
  assert.deepEqual(body.byRoute, [{ path: "/tiktok", usd: 0.028, requests: 2 }]);
  assert.equal(body.byDay.length, 1);
  const cook = body.byUser.find((u) => u.email === "cook@example.com");
  assert.deepEqual([cook.usd, cook.requests], [0.028, 1]);
  assert.ok(body.byUser.some((u) => u.userId === null && u.requests === 1)); // signed-out request

  const list = await call("boss", "/admin/costs/requests?limit=10");
  assert.equal(list.body.requests.length, 2);
  assert.equal(list.body.requests.find((r) => r.totalUsd > 0).userEmail, "cook@example.com");
});

test("bad admin query -> 400", async () => {
  assert.equal((await call("boss", "/admin/costs/summary?days=0")).status, 400);
});
