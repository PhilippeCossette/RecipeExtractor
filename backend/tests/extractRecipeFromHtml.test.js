import assert from "node:assert/strict";
import { test } from "node:test";
import { extractRecipeFromHtml } from "../src/services/recipe/index.js";

const page = (body, head = "") => `<html><head>${head}</head><body>${body}</body></html>`;

test("json-ld: reads a Recipe inside @graph, with sections and nutrition", () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: "ignored" },
      {
        "@type": ["Recipe"],
        name: "Crêpes &amp; sirop",
        author: [{ "@type": "Person", name: "Jo" }],
        image: [{ url: "/img/crepes.jpg" }],
        prepTime: "PT10M",
        cookTime: "PT20M",
        recipeYield: ["4", "4 portions"],
        recipeIngredient: ["250 ml lait", "2 eggs"],
        recipeInstructions: [
          { "@type": "HowToSection", name: "Pâte", itemListElement: [{ "@type": "HowToStep", text: "Mix." }] },
          { "@type": "HowToStep", text: "Cook." },
        ],
        recipeCategory: "Breakfast, Dessert",
        nutrition: { "@type": "NutritionInformation", calories: "120 kcal", fatContent: "3 g" },
        aggregateRating: { ratingValue: "4.5", ratingCount: "1,200" },
      },
    ],
  };
  const html = page("", `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  const r = extractRecipeFromHtml(html, "https://example.com/r/1");

  assert.equal(r.found, true);
  assert.equal(r.extractionMethod, "json-ld");
  assert.equal(r.title, "Crêpes & sirop");
  assert.equal(r.author, "Jo");
  assert.equal(r.image, "https://example.com/img/crepes.jpg");
  assert.deepEqual(r.timesMinutes, { prep: 10, cook: 20, total: 30 });
  assert.equal(r.yield, "4 portions");
  assert.equal(r.servings, 4);
  assert.deepEqual(r.instructions, [
    { section: "Pâte", text: "Mix." },
    { section: null, text: "Cook." },
  ]);
  assert.deepEqual(r.category, ["Breakfast", "Dessert"]);
  assert.deepEqual(r.nutrition, { calories: "120 kcal", fat: "3 g" });
  assert.deepEqual(r.rating, { value: 4.5, count: 1200 });
  assert.equal(r.ingredientsParsed[0].unit, "milliliter");
  assert.equal(r.siteName, "example.com");
});

test("json-ld: tolerates trailing commas", () => {
  const raw = `{"@type":"Recipe","name":"X","recipeIngredient":["1 cup rice",],}`;
  const r = extractRecipeFromHtml(page("", `<script type="application/ld+json">${raw}</script>`));
  assert.equal(r.found, true);
  assert.deepEqual(r.ingredients, ["1 cup rice"]);
});

test("microdata", () => {
  const html = page(`
    <div itemscope itemtype="http://schema.org/Recipe">
      <h1 itemprop="name">Soup</h1>
      <meta itemprop="totalTime" content="PT1H">
      <li itemprop="recipeIngredient">2 carrots</li>
      <li itemprop="recipeIngredient">1 l water</li>
      <p itemprop="recipeInstructions">Boil everything.</p>
    </div>`);
  const r = extractRecipeFromHtml(html);
  assert.equal(r.extractionMethod, "microdata");
  assert.equal(r.title, "Soup");
  assert.equal(r.timesMinutes.total, 60);
  assert.deepEqual(r.ingredients, ["2 carrots", "1 l water"]);
  assert.equal(r.instructions[0].text, "Boil everything.");
});

test("heuristic: Ingredients heading followed by a list", () => {
  const html = page(
    `<h2>Ingrédients</h2><ul><li>2 tasses de farine</li><li>1 oeuf</li></ul>
     <h2>Préparation</h2><ol><li>Mélanger.</li><li>Cuire.</li></ol>`,
    `<meta property="og:title" content="Gâteau">`
  );
  const r = extractRecipeFromHtml(html);
  assert.equal(r.extractionMethod, "heuristic");
  assert.equal(r.title, "Gâteau");
  assert.equal(r.ingredients.length, 2);
  assert.equal(r.instructions.length, 2);
});

test("no recipe", () => {
  const r = extractRecipeFromHtml(page("<p>Just an article about pancakes.</p>"), "https://x.com");
  assert.deepEqual(r, { found: false, sourceUrl: "https://x.com", reason: "No recipe data found on this page." });
});
