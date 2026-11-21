import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/**
 * THE place that decides who can see or change a list. Every list route goes through here.
 *
 * Today: only the owner can view or edit.
 * Sharing later plugs in here, e.g.:
 *   - visibility "link" + the right shareId  -> anyone can view (read-only)
 *   - a list_member table (user, role)       -> invited people can view or edit
 * The rest of the code just asks for "view" or "edit" and doesn't need to change.
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
