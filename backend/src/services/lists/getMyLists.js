import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

// Inside select fields Drizzle writes columns without their table ("id"), which is ambiguous in a subquery.
// So the subqueries use explicit aliases and name the outer list's id in full.
const LIST_ID = sql.raw(`"recipe_list"."id"`);

/**
 * The user's lists, by name, each with how many recipes it has and a cover image
 * (the image of the most recently added recipe that has one).
 */
export async function getMyLists(userId) {
  const { recipeList } = schema;
  return getDb()
    .select({
      id: recipeList.id,
      name: recipeList.name,
      description: recipeList.description,
      visibility: recipeList.visibility,
      createdAt: recipeList.createdAt,
      updatedAt: recipeList.updatedAt,
      recipeCount: sql`(select count(*)::int from recipe_list_item i where i.list_id = ${LIST_ID})`.mapWith(Number),
      coverImage: sql`(
        select r.image from recipe_list_item i
        join recipe r on r.id = i.recipe_id
        where i.list_id = ${LIST_ID} and r.image is not null
        order by i.added_at desc
        limit 1)`,
    })
    .from(recipeList)
    .where(eq(recipeList.ownerId, userId))
    .orderBy(asc(sql`lower(${recipeList.name})`));
}
