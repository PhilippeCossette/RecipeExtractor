import { z } from "zod";

/** GET /admin/costs/summary?days= */
export const CostSummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).default(30),
});

/** GET /admin/costs/requests?limit=&offset= */
export const CostLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
