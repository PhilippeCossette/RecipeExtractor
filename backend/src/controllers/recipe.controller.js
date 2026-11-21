import { getSessionFromRequest } from "../services/auth/index.js";
import { summarizeCost } from "../services/cost/index.js";
import { extractRecipeFromLink } from "../services/extractRecipeFromLink.js";
import { progressStorage, STEPS } from "../services/progress/index.js";
import { findRecipeBySourceKey, sourceKeyFromUrl } from "../services/recipes/index.js";

// The URL was already checked and cleaned by RecipeUrlSchema (validate middleware).
const urlFrom = (req) => (req.valid.body ?? req.valid.query).url;

/** The signed-in user's saved recipe for this link ({ id, title }), or null (signed out, new link, or unknown key). */
async function findSavedRecipeForLink(req) {
  const key = sourceKeyFromUrl(urlFrom(req));
  if (!key) return null;
  const session = await getSessionFromRequest(req).catch(() => null);
  return session?.user ? findRecipeBySourceKey(session.user.id, key) : null;
}

/**
 * POST /recipe { url }  or  GET /recipe?url=
 * One route for every link: the host decides the extractor. Answers once, with the recipe.
 */
export async function recipeController(req, res) {
  res.json(await extractRecipeFromLink(urlFrom(req)));
}

/**
 * POST /recipe/stream { url }
 * Same as POST /recipe, but streams what's happening as newline-delimited JSON, one event per line:
 *   {"type":"status","step":"fetch-tiktok","message":"Getting the video from TikTok"}
 *   {"type":"status","step":"read-caption","message":"Reading the caption"}
 *   {"type":"result","recipe":{ ...same as POST /recipe, plus cost }}
 * or, if the signed-in user already saved this link: {"type":"existing","recipe":{ id, title }} (nothing is extracted),
 * or, if something breaks, a last line {"type":"error","message":"..."}.
 * An invalid link still gets a normal 400 JSON answer before any streaming starts.
 */
export async function recipeStreamController(req, res) {
  res.status(200).set({
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no", // don't let a proxy (nginx) hold the lines back
  });
  res.flushHeaders();

  const send = (event) => {
    if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(event)}\n`);
  };

  send({ type: "status", step: "check-link", message: STEPS["check-link"] });
  try {
    // Already saved this post or page? Answer with it, without paying for the extraction again.
    const existing = await findSavedRecipeForLink(req);
    if (existing) {
      send({ type: "status", step: "already-saved", message: STEPS["already-saved"] });
      send({ type: "existing", recipe: existing });
      return res.end();
    }

    const recipe = await progressStorage.run(
      { onStep: (status) => send({ type: "status", ...status }) },
      () => extractRecipeFromLink(urlFrom(req))
    );
    // trackCost (which runs first) keeps this request's paid calls in res.locals.costTracker.
    send({ type: "result", recipe: { ...recipe, cost: summarizeCost(res.locals.costTracker?.items ?? []) } });
  } catch (err) {
    console.error("Recipe stream failed:", err);
    send({ type: "error", message: "Something went wrong while getting the recipe. Try again in a moment." });
  }
  res.end();
}
