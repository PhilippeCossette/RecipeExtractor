import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { httpError, isUniqueViolation } from "../../utils/index.js";
import { getListIfAllowed } from "./listAccess.js";

/** Rename a list or change its description. Null if not found / not allowed; 409 if the new name is taken. */
export async function updateList(userId, listId, changes) {
  const list = await getListIfAllowed(userId, listId, "edit");
  if (!list) return null;
  try {
    const [updated] = await getDb()
      .update(schema.recipeList)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(schema.recipeList.id, listId))
      .returning();
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) throw httpError(409, `You already have a list called "${changes.name}".`);
    throw err;
  }
}
