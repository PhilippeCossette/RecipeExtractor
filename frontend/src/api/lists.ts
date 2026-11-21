import type { RecipeList, RecipeListDetail } from "@/types/list";
import { apiRequest } from "./apiRequest";

export type ListInput = { name: string; description?: string | null };

const listPath = (id: string) => `/lists/${encodeURIComponent(id)}`;

/** GET /lists */
export async function getLists(): Promise<RecipeList[]> {
  return (await apiRequest<{ lists: RecipeList[] }>("/lists")).lists;
}

/** GET /lists/:id */
export async function getList(id: string): Promise<RecipeListDetail> {
  return (await apiRequest<{ list: RecipeListDetail }>(listPath(id))).list;
}

/** POST /lists. Throws "You already have a list called ..." (409) for a taken name. */
export async function createList(input: ListInput): Promise<RecipeList> {
  return (await apiRequest<{ list: RecipeList }>("/lists", { method: "POST", body: input })).list;
}

/** PATCH /lists/:id */
export async function updateList(id: string, changes: Partial<ListInput>): Promise<RecipeList> {
  return (await apiRequest<{ list: RecipeList }>(listPath(id), { method: "PATCH", body: changes })).list;
}

/** DELETE /lists/:id (recipes stay saved) */
export async function deleteList(id: string): Promise<void> {
  await apiRequest<null>(listPath(id), { method: "DELETE" });
}

/** PUT /lists/:id/recipes/:recipeId */
export async function addRecipeToList(listId: string, recipeId: string): Promise<void> {
  await apiRequest(`${listPath(listId)}/recipes/${encodeURIComponent(recipeId)}`, { method: "PUT" });
}

/** DELETE /lists/:id/recipes/:recipeId */
export async function removeRecipeFromList(listId: string, recipeId: string): Promise<void> {
  await apiRequest<null>(`${listPath(listId)}/recipes/${encodeURIComponent(recipeId)}`, { method: "DELETE" });
}
