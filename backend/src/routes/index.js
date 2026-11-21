import { Router } from "express";
import { config } from "../config/index.js";
import adminRoutes from "./admin.routes.js";
import extractRoutes from "./extract.routes.js";
import healthRoutes from "./health.routes.js";
import ingredientsRoutes from "./ingredients.routes.js";
import instagramRoutes from "./instagram.routes.js";
import listsRoutes from "./lists.routes.js";
import meRoutes from "./me.routes.js";
import recipeRoutes from "./recipe.routes.js";
import recipesRoutes from "./recipes.routes.js";
import tiktokRoutes from "./tiktok.routes.js";
import videoRoutes from "./video.routes.js";
import youtubeRoutes from "./youtube.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    endpoints: {
      "POST /recipe { url }": "Any link (website, TikTok, Instagram, YouTube): checked for safety, then sent to the right extractor by its host",
      "POST /recipe/stream { url }": "Same, streamed as JSON lines: a status per step, then the result (or an error)",
      "GET /extract?url=<recipe url>": "Detect and extract a recipe from a page",
      "POST /extract { url }": "Same, with the URL in a JSON body",
      "POST /tiktok { url, caption? }": "Recipe from a TikTok link: caption rules, then AI, then what's said in the video",
      "POST /instagram { url, caption? }": "Recipe from an Instagram reel or post: caption, then what's said in the reel",
      "POST /youtube { url, caption? }": "Recipe from a YouTube Short or video: title + description, then its captions",
      "POST /video (multipart) { video, caption?, url? }": "Recipe from any uploaded short video",
      "POST /ingredients/parse { lines: [...] }": "Parse ingredient lines only",
      "GET /health": "Health check",
      "POST /api/auth/sign-up/email { name, email, password }": "Create an account (sets the session cookie)",
      "POST /api/auth/sign-in/email { email, password }": "Sign in (sets the session cookie)",
      "POST /api/auth/sign-out": "Sign out",
      "GET /api/auth/get-session": "Current session, or null",
      "GET /me": "The signed-in user (needs sign-in)",
      "GET /recipes?limit=&offset=": "Your saved recipes, newest first (needs sign-in)",
      "POST /recipes { recipe }": "Save a recipe returned by /extract, /tiktok, /instagram, /youtube or /video (needs sign-in)",
      "GET /recipes/:id": "One saved recipe with all its data (needs sign-in)",
      "DELETE /recipes/:id": "Delete a saved recipe (needs sign-in)",
      "GET /lists": "Your recipe lists with recipe counts (needs sign-in)",
      "POST /lists { name, description? }": "Create a list, e.g. Asian, Quick (needs sign-in)",
      "GET /lists/:id": "One list with its recipes (needs sign-in)",
      "PATCH /lists/:id { name?, description? }": "Rename a list or change its description (needs sign-in)",
      "DELETE /lists/:id": "Delete a list; its recipes stay saved (needs sign-in)",
      "PUT /lists/:id/recipes/:recipeId": "Add a saved recipe to a list (needs sign-in)",
      "DELETE /lists/:id/recipes/:recipeId": "Take a recipe out of a list (needs sign-in)",
      "GET /admin/costs/summary?days=30": "API spending totals by service, day, route and user (admins only)",
      "GET /admin/costs/requests?limit=&offset=": "Each request's cost, newest first (admins only)",
    },
    features: {
      aiExtraction: config.ai.enabled,
      transcription: config.transcription.enabled,
      socialApi: config.scrapeCreators.enabled, // TikTok, Instagram, YouTube links
      accounts: config.database.enabled,
    },
  });
});

router.use("/recipe", recipeRoutes);
router.use("/extract", extractRoutes);
router.use("/tiktok", tiktokRoutes);
router.use("/instagram", instagramRoutes);
router.use("/youtube", youtubeRoutes);
router.use("/video", videoRoutes);
router.use("/ingredients", ingredientsRoutes);
router.use("/health", healthRoutes);
router.use("/me", meRoutes);
router.use("/recipes", recipesRoutes);
router.use("/lists", listsRoutes);
router.use("/admin", adminRoutes);

export default router;
