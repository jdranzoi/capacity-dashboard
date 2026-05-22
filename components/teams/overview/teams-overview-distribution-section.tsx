import { TeamsDistributionChart } from '@/components/teams/overview/teams-distribution-chart'
import { fmtHeadcountKpi } from '@/lib/overview/overview-metrics'
import type { TeamsOverviewPayload } from '@/lib/teams/overview/load-teams-overview'

export function TeamsOverviewDistributionSection({ data }: { data: TeamsOverviewPayload }) {
  return (
    <section className="space-y-3" data-slot="teams-overview-distribution">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Structure
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-72 flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Role distribution</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Roster grouped by stamped month role. Parentheses show share of total headcount.
              </p>
            </div>
            <output
              className="shrink-0 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-right ring-1 ring-foreground/4"
              aria-label={`Total headcount: ${fmtHeadcountKpi(data.headcount)}`}
            >
              <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-xl font-semibold tabular-nums leading-tight tracking-tight text-foreground">
                {fmtHeadcountKpi(data.headcount)}
              </span>
            </output>
          </div>
          <TeamsDistributionChart
            rows={data.byRole}
            totalHeadcount={data.headcount}
            emptyMessage="No roster members with a role assignment for this month."
            ariaLabel="Headcount by role as share of planning roster"
          />
        </div>

        <div className="flex min-h-72 flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Geographic distribution</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Roster grouped by holiday zone from <code className="font-mono text-[0.65rem]">dim_zone</code>.
                Zones drive PTO and holiday calendars.
              </p>
            </div>
            <output
              className="shrink-0 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-right ring-1 ring-foreground/4"
              aria-label={`Total headcount: ${fmtHeadcountKpi(data.headcount)}`}
            >
              <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-xl font-semibold tabular-nums leading-tight tracking-tight text-foreground">
                {fmtHeadcountKpi(data.headcount)}
              </span>
            </output>
          </div>
          <TeamsDistributionChart
            rows={data.byZone}
            totalHeadcount={data.headcount}
            emptyMessage="No roster members with a zone assignment."
            ariaLabel="Headcount by holiday zone as share of planning roster"
          />
        </div>
      </div>
    </section>
  )
}
