import { cleanText, hostnameOf } from "../../utils/index.js";
import { parseIngredient } from "../ingredients/index.js";
import {
  parseAuthor,
  parseImage,
  parseIngredientLines,
  parseInstructions,
  parseKeywords,
  parseNames,
  parseNutrition,
  parseRating,
  parseTimes,
  parseVideo,
  parseYield,
} from "./fields/index.js";

/** Turn a raw schema.org Recipe node into the API's clean response shape. */
export function normalizeRecipe(node, url, $, method) {
  const ingredients = parseIngredientLines(node);
  const { yield: yieldText, servings } = parseYield(node.recipeYield ?? node.yield);

  return {
    found: true,
    extractionMethod: method,
    sourceUrl: url,
    siteName: $('meta[property="og:site_name"]').attr("content") || hostnameOf(url),
    title: cleanText(node.name) || null,
    description: cleanText(node.description) || null,
    author: parseAuthor(node.author),
    image: parseImage(node.image || node.thumbnailUrl, url) || $('meta[property="og:image"]').attr("content") || null,
    video: parseVideo(node.video),
    timesMinutes: parseTimes(node),
    yield: yieldText,
    servings,
    ingredients,
    ingredientsParsed: ingredients.map(parseIngredient),
    instructions: parseInstructions(node.recipeInstructions),
    category: parseNames(node.recipeCategory),
    cuisine: parseNames(node.recipeCuisine),
    keywords: parseKeywords(node.keywords),
    nutrition: parseNutrition(node.nutrition),
    rating: parseRating(node.aggregateRating),
    datePublished: node.datePublished ?? null,
  };
}
