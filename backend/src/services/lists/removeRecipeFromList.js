import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getListIfAllowed } from "./listAccess.js";

/** Take a recipe out of a list (the recipe stays saved). Null when the list isn't found / not editable. */
export async function removeRecipeFromList(userId, listId, recipeId) {
  const list = await getListIfAllowed(userId, listId, "edit");
  if (!list) return null;
  const { recipeListItem } = schema;
  const removed = await getDb()
    .delete(recipeListItem)
    .where(and(eq(recipeListItem.listId, listId), eq(recipeListItem.recipeId, recipeId)))
    .returning({ recipeId: recipeListItem.recipeId });
  return { removed: removed.length > 0 };
}
