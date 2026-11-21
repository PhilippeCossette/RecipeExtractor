import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CostTable } from "@/components/admin/CostTable";
import { PeriodForm } from "@/components/admin/PeriodForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCostLogs, useCostSummary } from "@/hooks/useAdminCosts";
import { isAdmin } from "@/lib/authClient";
import type { CostItem } from "@/types/admin";
import { formatUsd } from "@/utils";

const SearchSchema = z.object({
  days: z.coerce.number().int().min(1).max(366).catch(30),
});

export const Route = createFileRoute("/_authed/admin")({
  validateSearch: SearchSchema, // /admin?days=7
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.session)) throw redirect({ to: "/home" }); // the API also refuses non-admins
  },
  component: AdminPage,
});

const SERVICE_LABELS: Record<string, string> = {
  claude: "Claude",
  scrapecreators: "ScrapeCreators",
  transcription: "OpenAI speech-to-text",
};
const describeItem = (item: CostItem) =>
  `${SERVICE_LABELS[item.service] ?? item.service}${item.model ? ` (${item.model})` : ""} ${formatUsd(item.usd)}`;

/** What the API has spent: totals, by service / route / user / day, and the latest requests. */
function AdminPage() {
  const { days } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const summary = useCostSummary(days);
  const logs = useCostLogs(50);
  const s = summary.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">API costs</h1>
        <PeriodForm days={days} onChange={(value) => navigate({ search: { days: value } })} />
      </div>

      {summary.isError ? <p className="text-destructive text-sm">{summary.error.message}</p> : null}
      {summary.isPending ? <p className="text-muted-foreground text-sm">Loading...</p> : null}

      {s ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Total spent" value={formatUsd(s.totalUsd)} />
            <Stat label="Requests" value={String(s.requests)} hint={`${s.paidRequests} used a paid API`} />
            <Stat label="Average per request" value={formatUsd(s.requests ? s.totalUsd / s.requests : 0)} />
          </div>
          {s.incompletePrices ? (
            <p className="text-muted-foreground text-xs">
              {s.incompletePrices} request(s) used a model with no price in config/pricing.js; they count as $0.
            </p>
          ) : null}

          <CostTable
            title="By service"
            rows={s.byService}
            columns={[
              { header: "Service", cell: (r) => `${SERVICE_LABELS[r.service] ?? r.service}${r.model ? ` (${r.model})` : ""}` },
              { header: "Calls", cell: (r) => r.calls, align: "right" },
              {
                header: "Usage",
                cell: (r) =>
                  r.credits ? `${r.credits} credits` : r.inputTokens ? `${r.inputTokens} in / ${r.outputTokens ?? 0} out` : "",
                align: "right",
              },
              { header: "Cost", cell: (r) => formatUsd(r.usd), align: "right" },
            ]}
          />
          <CostTable
            title="By route"
            rows={s.byRoute}
            columns={[
              { header: "Route", cell: (r) => r.path },
              { header: "Requests", cell: (r) => r.requests, align: "right" },
              { header: "Cost", cell: (r) => formatUsd(r.usd), align: "right" },
            ]}
          />
          <CostTable
            title="By user"
            rows={s.byUser}
            columns={[
              { header: "User", cell: (r) => r.email ?? "Signed out / API" },
              { header: "Requests", cell: (r) => r.requests, align: "right" },
              { header: "Cost", cell: (r) => formatUsd(r.usd), align: "right" },
            ]}
          />
          <CostTable
            title="By day"
            rows={s.byDay}
            columns={[
              { header: "Day", cell: (r) => r.day },
              { header: "Requests", cell: (r) => r.requests, align: "right" },
              { header: "Cost", cell: (r) => formatUsd(r.usd), align: "right" },
            ]}
          />
        </>
      ) : null}

      <CostTable
        title="Latest requests"
        rows={logs.data ?? []}
        empty={logs.isPending ? "Loading..." : "No requests yet."}
        columns={[
          { header: "When", cell: (r) => new Date(r.createdAt).toLocaleString() },
          { header: "Route", cell: (r) => `${r.path} (${r.status})` },
          { header: "User", cell: (r) => r.userEmail ?? "Signed out" },
          {
            header: "Calls",
            cell: (r) => (
              <span className="text-muted-foreground text-xs">{r.items.map(describeItem).join(" + ") || "free"}</span>
            ),
          },
          { header: "Cost", cell: (r) => formatUsd(r.totalUsd), align: "right" },
        ]}
      />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-muted-foreground px-4 text-xs">{hint}</CardContent> : null}
    </Card>
  );
}
