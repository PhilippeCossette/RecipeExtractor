import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIngredient } from "../src/services/ingredients/index.js";

// [line, quantity, quantityMax, unit, name, notes]
const CASES = [
  ["1 1/2 cups all-purpose flour, sifted", 1.5, null, "cup", "all-purpose flour", "sifted"],
  ["½ tsp salt", 0.5, null, "teaspoon", "salt", null],
  ["1½ tbsp olive oil", 1.5, null, "tablespoon", "olive oil", null],
  ["2-3 cloves garlic, minced", 2, 3, "clove", "garlic", "minced"],
  ["1 (14 oz) can diced tomatoes", 1, null, "can", "diced tomatoes", "14 oz"],
  ["3 large eggs", 3, null, null, "large eggs", null],
  ["Salt and pepper to taste", null, null, null, "Salt and pepper", "to taste"],
  ["a pinch of nutmeg", 1, null, "pinch", "nutmeg", null],
  ["1 lb ground beef (85% lean)", 1, null, "pound", "ground beef", "85% lean"],
  ["100g plain flour", 100, null, "gram", "plain flour", null],
  ["1 T butter", 1, null, "tablespoon", "butter", null],
  ["2 tomatoes", 2, null, null, "tomatoes", null],
  ["2 garlic cloves", 2, null, null, "garlic cloves", null],
  ["1 lemon, juiced", 1, null, null, "lemon", "juiced"],
  ["Canola oil, for frying", null, null, null, "Canola oil", "for frying"],
  ["1 can of 400 g chopped tomatoes", 1, null, "can", "chopped tomatoes", "400 g"],
  // French
  ["680 g (4 tasses) de pommes de terre Russet", 680, null, "gram", "pommes de terre Russet", "4 tasses"],
  ["15 ml (1 c. à soupe) d'huile d'olive", 15, null, "milliliter", "huile d'olive", "1 c. à soupe"],
  ["2,5 ml (½ c. à thé) de sel", 2.5, null, "milliliter", "sel", "½ c. à thé"],
  ["250 ml lait", 250, null, "milliliter", "lait", null],
  ["1 boîte de 540 ml (19 oz) de maïs en crème", 1, null, "can", "maïs en crème", "540 ml; 19 oz"],
  ["2 gousses d'ail, hachées", 2, null, "clove", "ail", "hachées"],
  ["1 g gélatine", 1, null, "gram", "gélatine", null],
];

for (const [line, quantity, quantityMax, unit, name, notes] of CASES) {
  test(`parses "${line}"`, () => {
    assert.deepEqual(parseIngredient(line), { raw: line, quantity, quantityMax, unit, name, notes });
  });
}
