import { getCostSummary, listCostLogs } from "../services/admin/index.js";

// requireAuth + requireAdmin run first; validate() puts the checked query in req.valid.

/** GET /admin/costs/summary?days=30 */
export async function costSummaryController(req, res) {
  res.json(await getCostSummary(req.valid.query));
}

/** GET /admin/costs/requests?limit=50&offset=0 */
export async function costLogsController(req, res) {
  const requests = await listCostLogs(req.valid.query);
  res.json({ requests, ...req.valid.query });
}
