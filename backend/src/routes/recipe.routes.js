import { Router } from "express";
import { recipeController, recipeStreamController } from "../controllers/recipe.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { RecipeUrlSchema } from "../validators/recipeUrl.validator.js";

// One route for any link: the URL is checked first, then sent to the right extractor by its host.
const router = Router();

router.get("/", validate({ query: RecipeUrlSchema }), trackCost, recipeController);
router.post("/", validate({ body: RecipeUrlSchema }), trackCost, recipeController);
// Same, streaming each step ("Reading the caption"...) as a line of JSON, then the recipe.
router.post("/stream", validate({ body: RecipeUrlSchema }), trackCost, recipeStreamController);

export default router;
