import { Router } from "express";
import {
  addRecipeToListController,
  createListController,
  deleteListController,
  getListController,
  listListsController,
  removeRecipeFromListController,
  updateListController,
} from "../controllers/lists.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { CreateListSchema, ListIdSchema, ListRecipeParamsSchema, UpdateListSchema } from "../validators/list.validator.js";

// Recipe lists ("Asian", "Quick"...). Signed-in users only; who can see/edit a list is decided in services/lists/listAccess.js.
const router = Router();

router.use(requireAuth);
router.get("/", listListsController);
router.post("/", validate({ body: CreateListSchema }), createListController);
router.get("/:id", validate({ params: ListIdSchema }), getListController);
router.patch("/:id", validate({ params: ListIdSchema, body: UpdateListSchema }), updateListController);
router.delete("/:id", validate({ params: ListIdSchema }), deleteListController);
router.put("/:id/recipes/:recipeId", validate({ params: ListRecipeParamsSchema }), addRecipeToListController);
router.delete("/:id/recipes/:recipeId", validate({ params: ListRecipeParamsSchema }), removeRecipeFromListController);

export default router;
