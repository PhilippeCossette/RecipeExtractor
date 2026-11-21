import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { httpError } from "../../utils/index.js";
import { getListIfAllowed } from "./listAccess.js";

/**
 * Put a saved recipe in a list. Adding it twice is fine (nothing changes).
 * The recipe must be the user's own. Returns { added: true } when new, { added: false } when it was already there,
 * or null when the list isn't found / not editable.
 */
export async function addRecipeToList(userId, listId, recipeId) {
  const list = await getListIfAllowed(userId, listId, "edit");
  if (!list) return null;

  const db = getDb();
  const [own] = await db
    .select({ id: schema.recipe.id })
    .from(schema.recipe)
    .where(and(eq(schema.recipe.id, recipeId), eq(schema.recipe.userId, userId)))
    .limit(1);
  if (!own) throw httpError(404, "Recipe not found");

  const inserted = await db
    .insert(schema.recipeListItem)
    .values({ listId, recipeId, addedBy: userId })
    .onConflictDoNothing()
    .returning({ recipeId: schema.recipeListItem.recipeId });
  await db.update(schema.recipeList).set({ updatedAt: new Date() }).where(eq(schema.recipeList.id, listId));
  return { added: inserted.length > 0 };
}
