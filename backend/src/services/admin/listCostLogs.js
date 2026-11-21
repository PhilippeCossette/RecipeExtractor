import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** Recent requests with their cost and who sent them, newest first. */
export async function listCostLogs({ limit, offset }) {
  const { apiRequest, user } = schema;
  const rows = await getDb()
    .select({
      id: apiRequest.id,
      createdAt: apiRequest.createdAt,
      method: apiRequest.method,
      path: apiRequest.path,
      status: apiRequest.status,
      durationMs: apiRequest.durationMs,
      url: apiRequest.url,
      totalUsd: apiRequest.totalUsd,
      complete: apiRequest.complete,
      items: apiRequest.items,
      userEmail: user.email,
    })
    .from(apiRequest)
    .leftJoin(user, eq(apiRequest.userId, user.id))
    .orderBy(desc(apiRequest.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}
