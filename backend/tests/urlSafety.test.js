import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config/index.js";
import { assertPublicUrl, detectPlatform, isPublicIp, normalizeUrlInput, safeFetch } from "../src/utils/index.js";
import { SafeUrlSchema } from "../src/validators/recipeUrl.validator.js";

// --- isPublicIp ---

test("isPublicIp blocks loopback, private, link-local, CGNAT and IPv6 tricks", () => {
  for (const ip of [
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "::1", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "[::1]", "224.0.0.1",
  ]) {
    assert.equal(isPublicIp(ip), false, ip);
  }
  for (const ip of ["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111", "172.32.0.1"]) {
    assert.equal(isPublicIp(ip), true, ip);
  }
});

// --- assertPublicUrl ---

test("assertPublicUrl refuses unsafe links", () => {
  for (const link of [
    "javascript:alert(1)", "file:///etc/passwd", "ftp://example.com/x", "data:text/html,hi",
    "http://localhost/x", "http://127.0.0.1/", "http://2130706433/", "http://0x7f000001/", "http://[::ffff:127.0.0.1]/",
    "http://169.254.169.254/latest/meta-data/", "http://user:pass@example.com/", "http://example.com:8080/",
    "http://printer.local/", "http://intranet/", "http://db.internal/",
  ]) {
    assert.throws(() => assertPublicUrl(new URL(link)), undefined, link);
  }
  for (const link of ["https://www.ricardocuisine.com/recettes/1", "http://example.com/", "https://youtu.be/abcdefghijk"]) {
    assert.doesNotThrow(() => assertPublicUrl(new URL(link)), link);
  }
});

// --- normalizeUrlInput ---

test("normalizeUrlInput pulls the link out of pasted text", () => {
  assert.equal(normalizeUrlInput("  https://x.com/a  "), "https://x.com/a");
  assert.equal(normalizeUrlInput("Check this out! https://vm.tiktok.com/ZMabc/ 🔥🔥"), "https://vm.tiktok.com/ZMabc/");
  assert.equal(normalizeUrlInput("(https://www.youtube.com/shorts/abcdefghijk)."), "https://www.youtube.com/shorts/abcdefghijk");
  assert.equal(normalizeUrlInput("www.ricardocuisine.com/recettes/1"), "https://www.ricardocuisine.com/recettes/1");
  assert.equal(normalizeUrlInput("pasta carbonara"), null);
  assert.equal(normalizeUrlInput(""), null);
});

// --- SafeUrlSchema ---

test("SafeUrlSchema returns the cleaned link", () => {
  assert.equal(SafeUrlSchema.parse("look: https://www.instagram.com/reel/ABC/#comments"), "https://www.instagram.com/reel/ABC/");
});

test("SafeUrlSchema rejects bad input with a readable message", () => {
  const message = (input) => SafeUrlSchema.safeParse(input).error?.issues[0].message;
  assert.match(message("pasta"), /doesn't look like a link/);
  assert.match(message("http://127.0.0.1/admin"), /not allowed/);
  assert.match(message("javascript:alert(1)"), /doesn't look like a link/);
  assert.match(message(`https://example.com/${"a".repeat(2100)}`), /too long/);
  assert.match(message("x".repeat(5000)), /too long/);
  assert.match(message(42), /link/);
});

// --- detectPlatform ---

test("detectPlatform picks the extractor from the host", () => {
  const p = (link) => detectPlatform(new URL(link));
  assert.equal(p("https://www.tiktok.com/@a/video/1"), "tiktok");
  assert.equal(p("https://vm.tiktok.com/ZMabc/"), "tiktok");
  assert.equal(p("https://www.instagram.com/reel/ABC/"), "instagram");
  assert.equal(p("https://youtu.be/abcdefghijk"), "youtube");
  assert.equal(p("https://m.youtube.com/shorts/abcdefghijk"), "youtube");
  assert.equal(p("https://www.ricardocuisine.com/recettes/1"), "website");
  assert.equal(p("https://tiktok.com.evil.example/x"), "website"); // look-alike hosts aren't trusted
});

// --- safeFetch: every redirect is checked before it's requested ---

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

test("safeFetch stops a redirect to a private address before requesting it", async () => {
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data/" } });
  };
  await assert.rejects(() => safeFetch("http://93.184.216.34/recipe"), /not allowed/);
  assert.deepEqual(requested, ["http://93.184.216.34/recipe"]); // the metadata address was never called
});

test("safeFetch follows public redirects and reports the final URL", async () => {
  globalThis.fetch = async (url) =>
    String(url).endsWith("/old")
      ? new Response(null, { status: 301, headers: { location: "/new" } })
      : new Response("ok", { status: 200 });
  const res = await safeFetch("http://93.184.216.34/old");
  assert.equal(res.url, "http://93.184.216.34/new");
  assert.equal(await res.text(), "ok");
});

// --- POST /recipe ---

let server;
let base;
before(async () => {
  config.costLog.enabled = false;
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = async (body) => {
  const res = await realFetch(`${base}/recipe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
};

test("POST /recipe refuses unsafe or non-links with 400", async () => {
  for (const url of ["http://localhost:3000/admin", "http://10.0.0.5/", "not a link", "javascript:alert(1)"]) {
    const { status, body } = await post({ url });
    assert.equal(status, 400, url);
    assert.equal(body.issues[0].path, "url");
  }
  assert.equal((await post({})).status, 400);
});

test("POST /recipe sends each host to its extractor", async () => {
  // Without SCRAPECREATORS_API_KEY nothing is fetched; we only check which extractor answered.
  const insta = await post({ url: "Saw this 😍 https://www.instagram.com/reel/ABC123/?igsh=x" });
  assert.equal(insta.status, 200);
  assert.equal(insta.body.platform, "instagram");
  assert.equal(insta.body.siteName, "Instagram");
  assert.equal(insta.body.sourceUrl, "https://www.instagram.com/reel/ABC123/");

  const yt = await post({ url: "youtu.be/abcdefghijk" });
  assert.equal(yt.body.platform, "youtube");
  assert.equal(yt.body.siteName, "YouTube");
});
