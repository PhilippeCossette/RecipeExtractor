import { assertPublicUrl, fetchHtml } from "../../utils/index.js";
import { extractRecipeFromHtml } from "./extractRecipeFromHtml.js";
import { reportProgress } from "../progress/index.js";

const notFound = (sourceUrl, reason) => ({ found: false, sourceUrl, reason });

/** Download a URL and extract its recipe. Never throws: failures come back as { found: false, reason }. */
export async function extractRecipe(url, options = {}) {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
    assertPublicUrl(parsed);
  } catch (err) {
    return notFound(withProtocol, `Invalid URL: ${err.message}`);
  }

  try {
    reportProgress("fetch-page");
    const { html, finalUrl } = await fetchHtml(parsed.href, options);
    reportProgress("read-page");
    return extractRecipeFromHtml(html, finalUrl);
  } catch (err) {
    const message = err.name === "TimeoutError" ? "Timed out fetching page" : err.message;
    return notFound(withProtocol, `Could not fetch page: ${message}`);
  }
}
