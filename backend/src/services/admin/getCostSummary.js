import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

const round = (n) => Math.round(Number(n ?? 0) * 1_000_000) / 1_000_000;

/**
 * What the API spent over the last `days` days, from the api_request table:
 * totals, by service (Claude per model, ScrapeCreators, speech-to-text), by day, by route and by user.
 */
export async function getCostSummary({ days }) {
  const db = getDb();
  const { apiRequest, user } = schema;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const inRange = gte(apiRequest.createdAt, since);

  const [totals] = await db
    .select({
      totalUsd: sum(apiRequest.totalUsd),
      requests: count(),
      paidRequests: sql`count(*) filter (where ${apiRequest.totalUsd} > 0)`,
      incomplete: sql`count(*) filter (where not ${apiRequest.complete})`,
    })
    .from(apiRequest)
    .where(inRange);

  // One row per paid call inside each request's `items` array.
  const byService = await db.execute(sql`
    select item->>'service' as service,
           item->>'model' as model,
           count(*)::int as calls,
           coalesce(sum((item->>'usd')::float8), 0) as usd,
           coalesce(sum((item->>'credits')::float8), 0) as credits,
           coalesce(sum((item->>'inputTokens')::float8), 0) as input_tokens,
           coalesce(sum((item->>'outputTokens')::float8), 0) as output_tokens
    from ${apiRequest}, jsonb_array_elements(${apiRequest.items}) as item
    where ${apiRequest.createdAt} >= ${since}
    group by 1, 2
    order by usd desc`);

  const day = sql`date_trunc('day', ${apiRequest.createdAt})`;
  const byDay = await db
    .select({ day, usd: sum(apiRequest.totalUsd), requests: count() })
    .from(apiRequest)
    .where(inRange)
    .groupBy(day)
    .orderBy(desc(day));

  const byRoute = await db
    .select({ path: apiRequest.path, usd: sum(apiRequest.totalUsd), requests: count() })
    .from(apiRequest)
    .where(inRange)
    .groupBy(apiRequest.path)
    .orderBy(desc(sum(apiRequest.totalUsd)));

  const byUser = await db
    .select({ userId: apiRequest.userId, email: user.email, name: user.name, usd: sum(apiRequest.totalUsd), requests: count() })
    .from(apiRequest)
    .leftJoin(user, eq(apiRequest.userId, user.id))
    .where(and(inRange))
    .groupBy(apiRequest.userId, user.email, user.name)
    .orderBy(desc(sum(apiRequest.totalUsd)))
    .limit(50);

  return {
    days,
    since: since.toISOString(),
    totalUsd: round(totals?.totalUsd),
    requests: Number(totals?.requests ?? 0),
    paidRequests: Number(totals?.paidRequests ?? 0),
    incompletePrices: Number(totals?.incomplete ?? 0),
    byService: (byService.rows ?? byService).map((r) => ({
      service: r.service,
      model: r.model ?? null,
      calls: Number(r.calls),
      usd: round(r.usd),
      credits: Number(r.credits) || undefined,
      inputTokens: Number(r.input_tokens) || undefined,
      outputTokens: Number(r.output_tokens) || undefined,
    })),
    byDay: byDay.map((r) => ({ day: new Date(r.day).toISOString().slice(0, 10), usd: round(r.usd), requests: Number(r.requests) })),
    byRoute: byRoute.map((r) => ({ path: r.path, usd: round(r.usd), requests: Number(r.requests) })),
    byUser: byUser.map((r) => ({
      userId: r.userId,
      email: r.email ?? null,
      name: r.name ?? null,
      usd: round(r.usd),
      requests: Number(r.requests),
    })),
  };
}
