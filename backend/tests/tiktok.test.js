import assert from "node:assert/strict";
import { test } from "node:test";
import { extractTikTokRecipe, parseCaption, parseTikTokUrl } from "../src/services/tiktok/index.js";

// Sample captions written for these tests, in the styles creators actually use.

const MULTILINE = `Best weeknight chili, recipe below! 👇
.
Easy Turkey Chili 🌶️
Serves 6 | Prep time: 15 min | Cook time: 40 min
.
Ingredients:
- 1 lb ground turkey
- 1 onion, diced
- 2 cans (15 oz) kidney beans, drained
- 1 tbsp chili powder
For the toppings:
- Sour cream
- Shredded cheddar
.
Instructions:
1. Brown the turkey with the onion.
2. Add beans and chili powder, then simmer 40 minutes.
3. Top and serve! 🤤
#chili #easydinner #fyp`;

const ONE_LINE_BULLETS = `This pasta went viral for a reason 😍 . Lemon Garlic Shrimp Pasta 🍋 Ingredients: -8 oz spaghetti -1 lb shrimp, peeled -3 cloves garlic, minced -2 tbsp butter -Juice of 1 lemon -Salt, to taste . 1. Boil the pasta. 2. Sear the shrimp in butter, about 2 minutes per side. 3. Add garlic and lemon, toss with pasta. #pasta #shrimp`;

const ONE_LINE_NO_BULLETS = `Grandma's Banana Bread. Did you grow up with this? Ingredients 3 ripe bananas 1/3 cup melted butter 3/4 cup sugar 1 egg (room temperature, beaten) 1 tsp baking soda 1 1/2 cups flour Steps 1. Mash the bananas and mix in the butter. 2. Stir in everything else. 3. Bake at 350. for 60 minutes. #bananabread`;

const FRENCH = `Pâté chinois rapide 🇨🇦
Ingrédients :
• 1 lb de boeuf haché
• 1 boîte de 398 ml de maïs en crème
• 4 tasses de purée de pommes de terre
Préparation :
Cuire le boeuf.
Étager le boeuf, le maïs et la purée.
Cuire 30 minutes à 375 °F.
#recette #quebec`;

test("multi-line caption with sections, sub-headings, times and servings", () => {
  const r = parseCaption(MULTILINE);
  assert.equal(r.found, true);
  assert.equal(r.title, "Easy Turkey Chili");
  assert.equal(r.servings, 6);
  assert.deepEqual(r.timesMinutes, { prep: 15, cook: 40, total: 55 });
  assert.deepEqual(r.ingredients, [
    "1 lb ground turkey",
    "1 onion, diced",
    "2 cans (15 oz) kidney beans, drained",
    "1 tbsp chili powder",
    "Sour cream",
    "Shredded cheddar",
  ]);
  assert.equal(r.ingredientsParsed[2].unit, "can");
  assert.equal(r.ingredientsParsed[2].notes, "15 oz; drained");
  assert.deepEqual(r.instructions.map((s) => s.text), [
    "Brown the turkey with the onion.",
    "Add beans and chili powder, then simmer 40 minutes.",
    "Top and serve!",
  ]);
  assert.deepEqual(r.keywords, ["chili", "easydinner", "fyp"]);
});

test("one-line caption with '-' bullets and numbered steps", () => {
  const r = parseCaption(ONE_LINE_BULLETS);
  assert.equal(r.found, true);
  assert.equal(r.title, "Lemon Garlic Shrimp Pasta");
  assert.equal(r.ingredients.length, 6);
  assert.equal(r.ingredients[0], "8 oz spaghetti");
  assert.equal(r.ingredientsParsed[5].name, "Salt");
  assert.equal(r.ingredientsParsed[5].notes, "to taste");
  assert.equal(r.instructions.length, 3);
  assert.equal(r.instructions[1].text, "Sear the shrimp in butter, about 2 minutes per side.");
});

test("one-line caption with no bullets splits at quantities and ignores out-of-sequence numbers", () => {
  const r = parseCaption(ONE_LINE_NO_BULLETS);
  assert.equal(r.found, true);
  assert.equal(r.title, "Grandma's Banana Bread");
  assert.deepEqual(r.ingredients, [
    "3 ripe bananas",
    "1/3 cup melted butter",
    "3/4 cup sugar",
    "1 egg (room temperature, beaten)",
    "1 tsp baking soda",
    "1 1/2 cups flour",
  ]);
  assert.equal(r.ingredientsParsed[3].name, "egg");
  assert.equal(r.ingredientsParsed[3].notes, "room temperature, beaten");
  assert.equal(r.instructions.length, 3);
  assert.equal(r.instructions[2].text, "Bake at 350. for 60 minutes.");
});

test("French caption with • bullets and unnumbered steps", () => {
  const r = parseCaption(FRENCH);
  assert.equal(r.found, true);
  assert.equal(r.title, "Pâté chinois rapide");
  assert.equal(r.ingredients.length, 3);
  assert.equal(r.ingredientsParsed[1].unit, "can");
  assert.equal(r.ingredientsParsed[1].name, "maïs en crème");
  assert.equal(r.ingredientsParsed[2].unit, "cup");
  assert.equal(r.instructions.length, 3);
});

test("caption without a recipe", () => {
  const r = parseCaption("Replying to @someone yes the recipe is in my bio! #fyp #foodtok");
  assert.equal(r.found, false);
  assert.match(r.reason, /No ingredient list/);
  assert.deepEqual(r.keywords, ["fyp", "foodtok"]);
});

test("parseTikTokUrl", () => {
  assert.deepEqual(parseTikTokUrl("https://www.tiktok.com/@chef.jo/video/7300000000000000001?lang=en&is_from_webapp=1"), {
    url: "https://www.tiktok.com/@chef.jo/video/7300000000000000001",
    isShortLink: false,
    username: "chef.jo",
    videoId: "7300000000000000001",
  });
  assert.equal(parseTikTokUrl("vm.tiktok.com/ZMabc123/").isShortLink, true);
  assert.equal(parseTikTokUrl("https://www.tiktok.com/t/ZTabc123/").isShortLink, true);
  assert.throws(() => parseTikTokUrl("https://www.youtube.com/watch?v=x"), /Not a TikTok link/);
  assert.throws(() => parseTikTokUrl("https://tiktok.com.evil.example/@a/video/1"), /Not a TikTok link/);
});

test("extractTikTokRecipe with caption only (no network)", async () => {
  const r = await extractTikTokRecipe({ caption: ONE_LINE_BULLETS });
  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "caption");
  assert.equal(r.siteName, "TikTok");
  assert.equal(r.caption, ONE_LINE_BULLETS);
});

test("extractTikTokRecipe rejects non-TikTok links", async () => {
  const r = await extractTikTokRecipe({ url: "https://example.com/video/1" });
  assert.equal(r.found, false);
  assert.match(r.reason, /isn't a TikTok link/);
});

test("extractTikTokRecipe without the TikTok API key: explains how to get the caption", async () => {
  const r = await extractTikTokRecipe({ caption: "   " });
  assert.equal(r.found, false);
  assert.match(r.reason, /SCRAPECREATORS_API_KEY/);
});
