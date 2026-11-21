import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** Delete a user's saved recipe. Returns true if it was deleted, false if it wasn't found (or isn't theirs). */
export async function deleteRecipe(userId, id) {
  const { recipe } = schema;
  const deleted = await getDb()
    .delete(recipe)
    .where(and(eq(recipe.id, id), eq(recipe.userId, userId)))
    .returning({ id: recipe.id });
  return deleted.length > 0;
}
