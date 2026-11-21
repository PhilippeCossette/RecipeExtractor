import assert from "node:assert/strict";
import { test } from "node:test";
import { captionMightHaveRecipe } from "../src/services/video/captionMightHaveRecipe.js";

test("captions with no recipe in them", () => {
  for (const caption of [
    "Jersey mikes hot pepper relish - recipe in the comments",
    "you HAVE to try this 😭 #soup #fyp #foodtok",
    "watch till the end 😭",
    "Replying to @someone yes!! link in bio https://example.com/x",
    "",
    null,
  ]) {
    assert.equal(captionMightHaveRecipe(caption), false, String(caption));
  }
});

test("captions that might have a recipe", () => {
  for (const caption of [
    "lazy soup lol, 1 onion and 2 cups broth",
    "½ tsp salt is the secret",
    "just chop garlic, butter and parm and mix with pasta",
    "Ingrédients : farine, oeufs, lait",
    "a pinch of salt and some olive oil",
    "x".repeat(200),
  ]) {
    assert.equal(captionMightHaveRecipe(caption), true, caption.slice(0, 40));
  }
});

test("hashtags and mentions don't count as numbers", () => {
  assert.equal(captionMightHaveRecipe("so good #recipe2024 @chef123"), false);
});
