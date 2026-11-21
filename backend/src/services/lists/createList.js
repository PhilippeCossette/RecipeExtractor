import { getDb, schema } from "../../db/index.js";
import { httpError, isUniqueViolation } from "../../utils/index.js";

/** Create a list. Throws 409 if the user already has one with that name (any letter case). */
export async function createList(userId, { name, description }) {
  try {
    const [list] = await getDb()
      .insert(schema.recipeList)
      .values({ ownerId: userId, name, description: description ?? null })
      .returning();
    return list;
  } catch (err) {
    if (isUniqueViolation(err)) throw httpError(409, `You already have a list called "${name}".`);
    throw err;
  }
}
