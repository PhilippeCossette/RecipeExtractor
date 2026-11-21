import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";

/**
 * Recipes a signed-in user saved. The few columns you'd list or search by are their own columns;
 * the full extracted recipe (ingredients, steps, times...) is kept as-is in `data`.
 */
export const recipe = pgTable(
  "recipe",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // deleting a user deletes their recipes
    title: text("title").notNull(),
    sourceUrl: text("source_url"),
    // "tiktok:<id>", "instagram:<shortcode>", "youtube:<id>" or "web:<canonical url>" (services/recipes/sourceKey.js).
    // Unique per user, so the same post or page can't be saved twice. Null when unknown (never blocks a save).
    sourceKey: text("source_key"),
    siteName: text("site_name"),
    image: text("image"),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("recipe_user_id_created_at_idx").on(t.userId, t.createdAt),
    uniqueIndex("recipe_user_id_source_key_unique").on(t.userId, t.sourceKey),
  ]
);
