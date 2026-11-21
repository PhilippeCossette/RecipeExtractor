import * as cheerio from "cheerio";
import { normalizeRecipe } from "./normalizeRecipe.js";
import { STRATEGIES } from "./strategies/index.js";

/** Find a recipe in an HTML string. Use this when you already have the page (tests, other scrapers). */
export function extractRecipeFromHtml(html, url = "") {
  const $ = cheerio.load(html);
  for (const strategy of STRATEGIES) {
    const node = strategy.run($);
    if (node) return normalizeRecipe(node, url, $, strategy.name);
  }
  return { found: false, sourceUrl: url, reason: "No recipe data found on this page." };
}
