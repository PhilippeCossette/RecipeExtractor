import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/**
 * The only place that decides who can view or edit a list (today: the owner only).
 * Sharing would plug in here; callers just ask for "view" or "edit".
 *
 * @param {{ ownerId: string, visibility: string }} list
 * @param {string | null} userId
 * @returns {{ view: boolean, edit: boolean, isOwner: boolean }}
 */
export function listPermissions(list, userId) {
  const isOwner = Boolean(userId) && list.ownerId === userId;
  return { view: isOwner, edit: isOwner, isOwner };
}

/**
 * The list if `userId` may do `action` on it, else null. Callers answer 404 either way,
 * so a list you can't see looks the same as one that doesn't exist.
 * @param {"view" | "edit"} action
 */
export async function getListIfAllowed(userId, listId, action) {
  const [list] = await getDb().select().from(schema.recipeList).where(eq(schema.recipeList.id, listId)).limit(1);
  if (!list) return null;
  return listPermissions(list, userId)[action] ? list : null;
}
