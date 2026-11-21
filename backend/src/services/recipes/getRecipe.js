import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** One saved recipe with its full data, or null if it doesn't exist or belongs to someone else. */
export async function getRecipe(userId, id) {
  const { recipe } = schema;
  const [row] = await getDb()
    .select()
    .from(recipe)
    .where(and(eq(recipe.id, id), eq(recipe.userId, userId)))
    .limit(1);
  return row ?? null;
}
