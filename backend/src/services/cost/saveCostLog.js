import { getDb, schema } from "../../db/index.js";

/**
 * Store one request's cost in the api_request table (for the admin pages).
 * Does nothing without a database. Never throws: a logging problem must not break anything.
 */
export async function saveCostLog({ userId, method, path, status, durationMs, url, summary }) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(schema.apiRequest).values({
      userId: userId ?? null,
      method,
      path,
      status,
      durationMs,
      url: typeof url === "string" ? url.slice(0, 2000) : null,
      totalUsd: summary.totalUsd,
      complete: summary.complete,
      items: summary.items,
    });
  } catch (err) {
    console.error("Couldn't save the cost log to the database:", err.message);
  }
}
