import { parseIngredient } from "../ingredients/index.js";

/** Convert Claude's AiRecipeSchema output into the API's standard recipe shape. */
const roundOrNull = (n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null);

export function toRecipeResponse(recipe, extra = {}) {
  const prep = roundOrNull(recipe.prepMinutes);
  const cook = roundOrNull(recipe.cookMinutes);
  const total = roundOrNull(recipe.totalMinutes) ?? (prep || cook ? (prep || 0) + (cook || 0) : null);

  return {
    found: true,
    ...extra,
    title: recipe.title,
    description: recipe.description,
    timesMinutes: { prep, cook, total },
    yield: recipe.yield,
    servings: roundOrNull(recipe.servings),
    ingredients: recipe.ingredients,
    ingredientsParsed: recipe.ingredients.map(parseIngredient),
    instructions: recipe.instructions.map((text) => ({ section: null, text })),
    tips: recipe.tips,
    category: [],
    cuisine: [],
    keywords: extra.keywords ?? [],
    nutrition: {},
    rating: null,
    datePublished: null,
  };
}
