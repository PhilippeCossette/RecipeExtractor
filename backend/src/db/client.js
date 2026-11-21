import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { config } from "../config/index.js";
import * as schema from "./schema/index.js";

/**
 * Drizzle on Neon. Uses Neon's WebSocket Pool (not the HTTP driver) because Better Auth needs transactions.
 * Created on first use, so the server starts fine without DATABASE_URL.
 */
let db = null;

/** The Drizzle client, or null when DATABASE_URL isn't set. */
export function getDb() {
  if (!db && config.database.enabled) {
    db = drizzle({ client: new Pool({ connectionString: config.database.url }), schema });
  }
  return db;
}

/** Replace the client (tests). */
export function setDb(replacement) {
  db = replacement;
}
