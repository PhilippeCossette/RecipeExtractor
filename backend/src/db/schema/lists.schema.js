import { sql } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";
import { recipe } from "./recipes.schema.js";

/**
 * A user's recipe list ("Asian", "Quick"...). Built so sharing can be added later without reshaping data:
 *   - visibility: "private" today. Later e.g. "link" (anyone with the share link can view) or "public".
 *   - shareId:    empty today. Later a random id for the share link (/shared/<shareId>), replaceable to revoke.
 * Who may view or edit a list is decided in one place: services/lists/listAccess.js.
 */
export const recipeList = pgTable(
  "recipe_list",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    visibility: text("visibility").notNull().default("private"),
    shareId: text("share_id").unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("recipe_list_owner_id_idx").on(t.ownerId),
    // "Asian" and "asian" are the same list for one user
    uniqueIndex("recipe_list_owner_name_unique").on(t.ownerId, sql`lower(${t.name})`),
  ]
);

/** Which recipes are in which list. A recipe can be in many lists; deleting either side removes the link only. */
export const recipeListItem = pgTable(
  "recipe_list_item",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => recipeList.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    // Who added it: always the owner today; with shared editing later, the collaborator.
    addedBy: text("added_by").references(() => user.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.listId, t.recipeId] }), index("recipe_list_item_recipe_id_idx").on(t.recipeId)]
);
