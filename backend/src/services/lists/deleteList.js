import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getListIfAllowed, listPermissions } from "./listAccess.js";

/** Delete a list (only its owner can). The recipes themselves stay saved. Returns false if not found / not allowed. */
export async function deleteList(userId, listId) {
  const list = await getListIfAllowed(userId, listId, "edit");
  if (!list || !listPermissions(list, userId).isOwner) return false; // editors (later) can't delete the list
  await getDb().delete(schema.recipeList).where(eq(schema.recipeList.id, listId));
  return true;
}
