import { config } from "../../config/index.js";
import { pricing } from "../../config/pricing.js";
import { recordCost } from "../cost/index.js";

// Status codes from the ScrapeCreators docs.
const ERROR_MESSAGES = {
  400: "the social media API rejected the request (bad parameters)",
  401: "the ScrapeCreators API key is invalid",
  402: "the ScrapeCreators account is out of credits",
  403: "the post can't be accessed (private, age-restricted or blocked)",
  404: "post not found (it may be private, deleted or region-locked)",
  500: "the social media API had an error, try again later",
};

/**
 * GET a ScrapeCreators endpoint (TikTok, Instagram, YouTube...) with the API key.
 * Returns the JSON body, or throws an Error with a readable message.
 * Records the call's cost from `credits_charged` when the response has it, else `fallbackCredits`.
 *
 * `retries`: try again (after 1 s) on 404/500. ScrapeCreators sometimes answers 404 for a public
 * post that works on the next try; failed calls cost no credits.
 *
 * @param {string} path e.g. "/v1/instagram/post"
 * @param {Record<string, unknown>} params query string
 * @param {{ fallbackCredits?: (body: any) => number, retries?: number }} [options]
 */
export async function scrapeCreatorsRequest(path, params, { fallbackCredits, retries = 0 } = {}) {
  try {
    return await requestOnce(path, params, fallbackCredits);
  } catch (err) {
    if (retries > 0 && (err.status === 404 || err.status === 500)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return scrapeCreatorsRequest(path, params, { fallbackCredits, retries: retries - 1 });
    }
    throw err;
  }
}

async function requestOnce(path, params, fallbackCredits) {
  const url = new URL(path, config.scrapeCreators.baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { "x-api-key": config.scrapeCreators.apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(config.scrapeCreators.timeoutMs),
  });

  if (!res.ok) {
    const err = new Error(ERROR_MESSAGES[res.status] ?? `the social media API returned HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.json();

  // Credits are only spent on successful calls.
  const credits = Number.isFinite(body?.credits_charged)
    ? body.credits_charged
    : (fallbackCredits?.(body) ?? pricing.scrapeCreators.creditsPerCall);
  recordCost({ service: "scrapecreators", detail: path, credits, usd: credits * pricing.scrapeCreators.usdPerCredit });

  if (body?.success === false) throw new Error("the social media API couldn't get this post");
  return body;
}
