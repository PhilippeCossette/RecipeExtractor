/**
 * Give recipes saved before source keys existed their key, so they're found as duplicates too.
 *   npm run db:backfill-keys
 * Safe to run again. If a user already saved the same source twice, the older copy gets the key
 * and the extra ones are listed (they stay; delete them from the dashboard if you like).
 */
import { asc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "../src/db/index.js";
import { sourceKeyForRecipe } from "../src/services/recipes/index.js";

const db = getDb();
if (!db) {
  console.error("DATABASE_URL isn't set in .env.");
  process.exit(1);
}

const rows = await db.select().from(schema.recipe).where(isNull(schema.recipe.sourceKey)).orderBy(asc(schema.recipe.createdAt));
let updated = 0;
const duplicates = [];
for (const row of rows) {
  const key = sourceKeyForRecipe({ ...row.data, sourceUrl: row.data?.sourceUrl ?? row.sourceUrl });
  if (!key) continue;
  try {
    await db.update(schema.recipe).set({ sourceKey: key }).where(eq(schema.recipe.id, row.id));
    updated++;
  } catch {
    duplicates.push(`${row.id} (${row.title})`); // same user + key already taken by an older copy
  }
}
console.log(`Recipes without a key: ${rows.length}. Keys added: ${updated}.`);
if (duplicates.length) console.log(`Duplicates left without a key:\n  ${duplicates.join("\n  ")}`);
process.exit(0);
