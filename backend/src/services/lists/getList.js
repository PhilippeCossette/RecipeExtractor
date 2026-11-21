import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getListIfAllowed, listPermissions } from "./listAccess.js";

/**
 * A list with its recipes (newest added first) and what the user may do with it,
 * or null if it doesn't exist or the user can't view it.
 */
export async function getList(userId, listId) {
  const list = await getListIfAllowed(userId, listId, "view");
  if (!list) return null;

  const { recipe, recipeListItem } = schema;
  const recipes = await getDb()
    .select({
      id: recipe.id,
      title: recipe.title,
      sourceUrl: recipe.sourceUrl,
      siteName: recipe.siteName,
      image: recipe.image,
      createdAt: recipe.createdAt,
      addedAt: recipeListItem.addedAt,
    })
    .from(recipeListItem)
    .innerJoin(recipe, eq(recipe.id, recipeListItem.recipeId))
    .where(eq(recipeListItem.listId, listId))
    .orderBy(desc(recipeListItem.addedAt));

  const { edit, isOwner } = listPermissions(list, userId);
  const { shareId, ...publicFields } = list; // the share id stays private until sharing exists
  return { ...publicFields, recipes, permissions: { edit, isOwner } };
}
