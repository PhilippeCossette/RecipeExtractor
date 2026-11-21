import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { sourceKeyForRecipe } from "./sourceKey.js";

// Per-request fields that shouldn't be stored with the recipe.
const NOT_STORED = ["cost", "attempts", "warnings"];

/**
 * Save a found recipe for a user, once per source: if the user already saved the same post or page
 * (same source key), nothing is inserted and the existing recipe is returned.
 * The unique index on (user_id, source_key) makes this safe even for two saves at the same moment.
 * @returns {Promise<{ recipe: object, created: boolean }>}
 */
export async function saveRecipe(userId, recipe) {
  const db = getDb();
  const sourceKey = sourceKeyForRecipe(recipe);
  const data = Object.fromEntries(Object.entries(recipe).filter(([key]) => !NOT_STORED.includes(key)));

  const [inserted] = await db
    .insert(schema.recipe)
    .values({
      userId,
      title: recipe.title || "Untitled recipe",
      sourceUrl: recipe.sourceUrl ?? null,
      sourceKey,
      siteName: recipe.siteName ?? null,
      image: recipe.image ?? null,
      data,
    })
    .onConflictDoNothing({ target: [schema.recipe.userId, schema.recipe.sourceKey] })
    .returning();
  if (inserted) return { recipe: inserted, created: true };

  // Already saved: hand back the existing one.
  const [existing] = await db
    .select()
    .from(schema.recipe)
    .where(and(eq(schema.recipe.userId, userId), eq(schema.recipe.sourceKey, sourceKey)))
    .limit(1);
  return { recipe: existing, created: false };
}
