import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** The user's own lists that contain this recipe ({ id, name }), for the recipe page's "In lists" checkboxes. */
export async function getListsForRecipe(userId, recipeId) {
  const { recipeList, recipeListItem } = schema;
  return getDb()
    .select({ id: recipeList.id, name: recipeList.name })
    .from(recipeListItem)
    .innerJoin(recipeList, eq(recipeList.id, recipeListItem.listId))
    .where(and(eq(recipeListItem.recipeId, recipeId), eq(recipeList.ownerId, userId)))
    .orderBy(asc(sql`lower(${recipeList.name})`));
}
