import type { RecipeResponse, SavedRecipe, SavedRecipeSummary } from "@/types/recipe";
import { apiRequest } from "./apiRequest";

/** GET /recipes: the signed-in user's saved recipes, newest first. */
export async function listSavedRecipes(): Promise<SavedRecipeSummary[]> {
  const { recipes } = await apiRequest<{ recipes: SavedRecipeSummary[] }>("/recipes?limit=100");
  return recipes;
}

/** GET /recipes/:id */
export async function getSavedRecipe(id: string): Promise<SavedRecipe> {
  const { recipe } = await apiRequest<{ recipe: SavedRecipe }>(`/recipes/${encodeURIComponent(id)}`);
  return recipe;
}

/**
 * POST /recipes { recipe }. If this post or page was already saved, the API returns that recipe
 * with alreadySaved: true instead of making a copy.
 */
export function saveRecipe(recipe: RecipeResponse): Promise<{ recipe: SavedRecipe; alreadySaved: boolean }> {
  return apiRequest("/recipes", { method: "POST", body: { recipe } });
}

/** DELETE /recipes/:id */
export async function deleteSavedRecipe(id: string): Promise<void> {
  await apiRequest<null>(`/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
