/** GET /admin/costs/summary */
export type CostSummary = {
  days: number;
  since: string;
  totalUsd: number;
  requests: number;
  paidRequests: number;
  incompletePrices: number;
  byService: {
    service: string;
    model: string | null;
    calls: number;
    usd: number;
    credits?: number;
    inputTokens?: number;
    outputTokens?: number;
  }[];
  byDay: { day: string; usd: number; requests: number }[];
  byRoute: { path: string; usd: number; requests: number }[];
  byUser: { userId: string | null; email: string | null; name: string | null; usd: number; requests: number }[];
};

/** One paid call inside a request. */
export type CostItem = { service: string; usd: number | null; model?: string; credits?: number; detail?: string };

/** GET /admin/costs/requests */
export type CostLog = {
  id: string;
  createdAt: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  url: string | null;
  totalUsd: number;
  complete: boolean;
  items: CostItem[];
  userEmail: string | null;
};
