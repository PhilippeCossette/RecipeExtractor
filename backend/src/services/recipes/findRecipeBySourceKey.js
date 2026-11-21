import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** The user's saved recipe for this source key ({ id, title }), or null. */
export async function findRecipeBySourceKey(userId, sourceKey) {
  if (!sourceKey) return null;
  const { recipe } = schema;
  const [row] = await getDb()
    .select({ id: recipe.id, title: recipe.title })
    .from(recipe)
    .where(and(eq(recipe.userId, userId), eq(recipe.sourceKey, sourceKey)))
    .limit(1);
  return row ?? null;
}
