import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** A user's saved recipes, newest first, without the full recipe data (for a list screen). */
export async function listRecipes(userId, { limit, offset }) {
  const { recipe } = schema;
  return getDb()
    .select({
      id: recipe.id,
      title: recipe.title,
      sourceUrl: recipe.sourceUrl,
      siteName: recipe.siteName,
      image: recipe.image,
      createdAt: recipe.createdAt,
    })
    .from(recipe)
    .where(eq(recipe.userId, userId))
    .orderBy(desc(recipe.createdAt))
    .limit(limit)
    .offset(offset);
}
