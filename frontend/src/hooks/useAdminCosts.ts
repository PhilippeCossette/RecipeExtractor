import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCostSummary, listCostLogs } from "@/api/adminCosts";

/** Spending totals for the last `days` days. Keeps the old numbers on screen while a new period loads. */
export function useCostSummary(days: number) {
  return useQuery({ queryKey: ["admin", "cost-summary", days], queryFn: () => getCostSummary(days), placeholderData: keepPreviousData });
}

/** The latest requests and what each cost. */
export function useCostLogs(limit = 50) {
  return useQuery({ queryKey: ["admin", "cost-logs", limit], queryFn: () => listCostLogs(limit) });
}
