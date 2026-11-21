import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPublicUrl, cleanText, isoDurationToMinutes } from "../src/utils/index.js";

test("isoDurationToMinutes", () => {
  assert.equal(isoDurationToMinutes("PT1H30M"), 90);
  assert.equal(isoDurationToMinutes("P0DT0H45M"), 45);
  assert.equal(isoDurationToMinutes("PT20M"), 20);
  assert.equal(isoDurationToMinutes(15), 15);
  assert.equal(isoDurationToMinutes(""), null);
  assert.equal(isoDurationToMinutes("PT0M"), null);
});

test("cleanText strips tags, entities and extra spaces", () => {
  assert.equal(cleanText("  <b>Crème</b> &amp; sucre&nbsp;&#233; \n "), "Crème & sucre é");
  assert.equal(cleanText(null), "");
});

test("assertPublicUrl blocks private addresses", () => {
  for (const url of ["http://localhost/", "http://127.0.0.1/", "http://192.168.1.5/", "http://10.0.0.1/", "http://[::1]/", "ftp://example.com/"]) {
    assert.throws(() => assertPublicUrl(new URL(url)), undefined, url);
  }
  assert.doesNotThrow(() => assertPublicUrl(new URL("https://www.bbcgoodfood.com/recipes/x")));
});
