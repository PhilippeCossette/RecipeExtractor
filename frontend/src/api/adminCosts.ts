import type { CostLog, CostSummary } from "@/types/admin";
import { apiRequest } from "./apiRequest";

/** GET /admin/costs/summary?days= (admins only) */
export function getCostSummary(days: number): Promise<CostSummary> {
  return apiRequest<CostSummary>(`/admin/costs/summary?days=${days}`);
}

/** GET /admin/costs/requests?limit= (admins only) */
export async function listCostLogs(limit: number): Promise<CostLog[]> {
  const { requests } = await apiRequest<{ requests: CostLog[] }>(`/admin/costs/requests?limit=${limit}`);
  return requests;
}
