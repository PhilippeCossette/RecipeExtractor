import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";

/** One row per recipe request and what it cost. Written by trackCost, read by the admin pages. */
export const apiRequest = pgTable(
  "api_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // null when signed out
    method: text("method").notNull(),
    path: text("path").notNull(),
    status: integer("status").notNull(),
    durationMs: integer("duration_ms").notNull(),
    url: text("url"), // the link that was sent, if any
    totalUsd: doublePrecision("total_usd").notNull(),
    complete: boolean("complete").notNull(), // false when a call had no known price
    // Each paid call: { service: "claude" | "scrapecreators" | "transcription", usd, model?, credits?, ... }
    items: jsonb("items").notNull(),
  },
  (t) => [index("api_request_created_at_idx").on(t.createdAt), index("api_request_user_id_idx").on(t.userId)]
);
