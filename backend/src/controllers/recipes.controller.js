import { getListsForRecipe } from "../services/lists/index.js";
import { deleteRecipe, getRecipe, listRecipes, saveRecipe } from "../services/recipes/index.js";

// requireAuth sets req.user; validate() puts the checked input in req.valid.

/** GET /recipes?limit=&offset= */
export async function listRecipesController(req, res) {
  const recipes = await listRecipes(req.user.id, req.valid.query);
  res.json({ recipes, ...req.valid.query });
}

/**
 * POST /recipes { recipe }
 * 201 { recipe, alreadySaved: false } when it's new;
 * 200 { recipe, alreadySaved: true } with the existing one when the user already saved this post or page.
 */
export async function saveRecipeController(req, res) {
  const { recipe, created } = await saveRecipe(req.user.id, req.valid.body.recipe);
  res.status(created ? 201 : 200).json({ recipe, alreadySaved: !created });
}

/** GET /recipes/:id, with the user's lists it's in: { recipe: { ...row, lists: [{ id, name }] } } */
export async function getRecipeController(req, res) {
  const recipe = await getRecipe(req.user.id, req.valid.params.id);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  const lists = await getListsForRecipe(req.user.id, recipe.id);
  res.json({ recipe: { ...recipe, lists } });
}

/** DELETE /recipes/:id */
export async function deleteRecipeController(req, res) {
  const deleted = await deleteRecipe(req.user.id, req.valid.params.id);
  if (!deleted) return res.status(404).json({ error: "Recipe not found" });
  res.status(204).end();
}
