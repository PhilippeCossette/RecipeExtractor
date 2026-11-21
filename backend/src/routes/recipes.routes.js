import { Router } from "express";
import {
  deleteRecipeController,
  getRecipeController,
  listRecipesController,
  saveRecipeController,
} from "../controllers/recipes.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { ListRecipesQuerySchema, RecipeIdSchema, SaveRecipeSchema } from "../validators/recipe.validator.js";

// Every /recipes route needs a signed-in user; each user only sees their own recipes.
const router = Router();

router.use(requireAuth);
router.get("/", validate({ query: ListRecipesQuerySchema }), listRecipesController);
router.post("/", validate({ body: SaveRecipeSchema }), saveRecipeController);
router.get("/:id", validate({ params: RecipeIdSchema }), getRecipeController);
router.delete("/:id", validate({ params: RecipeIdSchema }), deleteRecipeController);

export default router;
