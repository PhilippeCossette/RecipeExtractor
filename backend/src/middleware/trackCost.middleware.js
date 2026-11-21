import { costStorage, logCost, saveCostLog, summarizeCost } from "../services/cost/index.js";
import { getSessionFromRequest } from "../services/auth/index.js";

/**
 * Track what one request spends on paid APIs (Claude, OpenAI, ScrapeCreators).
 * Adds a `cost` field to the JSON response. When the response is sent, it logs a console line,
 * appends to logs/costs.jsonl, and stores a row in the database (with the user, if signed in).
 * Put it after body parsers (multer), so the tracking context isn't lost in their stream callbacks.
 */
export function trackCost(req, res, next) {
  const tracker = { items: [] };
  const startedAt = performance.now();
  res.locals.costTracker = tracker; // streaming routes add the cost to their last event themselves

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const isObject = body && typeof body === "object" && !Array.isArray(body);
    return sendJson(isObject ? { ...body, cost: summarizeCost(tracker.items) } : body);
  };

  res.on("finish", async () => {
    const entry = {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      summary: summarizeCost(tracker.items),
    };
    logCost(entry);
    // After the response, so looking up who sent it doesn't slow the request down.
    const session = await getSessionFromRequest(req).catch(() => null);
    // The checked, cleaned URL when validate() ran first (/recipe), else whatever was sent.
    const url = req.valid?.body?.url ?? req.valid?.query?.url ?? req.query?.url ?? req.body?.url;
    await saveCostLog({ ...entry, userId: session?.user?.id, url });
  });

  costStorage.run(tracker, next);
}
