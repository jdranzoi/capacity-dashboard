import { TeamToolbar } from '@/components/team/team-toolbar'
import type { TeamFilterOptionsPayload } from '@/lib/team/load-team-filter-options'
import type { TeamMonthKpisPayload } from '@/lib/team/load-team-month-kpis'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TeamKpiSection } from '@/components/team/team-kpi-section'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function TeamPageShell({
  referenceMonthLabel,
  monthPicker,
  filterOptions,
  routeFilters,
  kpis,
}: {
  referenceMonthLabel: string
  monthPicker: { options: OverviewMonthOption[]; selectedMonthKey: string } | null
  filterOptions: TeamFilterOptionsPayload
  routeFilters: TeamRouteFilters
  kpis: TeamMonthKpisPayload
}) {
  return (
    <div className="flex flex-col gap-8">
      <header
        className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
        data-slot="team-header"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Workforce utilization and staffing — {referenceMonthLabel}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
          Export
        </Button>
      </header>

      <TeamToolbar
        monthPicker={monthPicker}
        filterOptions={filterOptions}
        routeFilters={routeFilters}
      />

      <TeamKpiSection kpis={kpis} />

      <section data-slot="team-analytics-grid" aria-labelledby="team-analytics-heading">
        <h2
          id="team-analytics-heading"
          className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Analytics
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {['Utilization by role', 'Capacity distribution', 'Headcount by role', 'Skills metrics'].map(
            (title) => (
              <div
                key={title}
                className="flex min-h-72 flex-col rounded-xl border border-border bg-card/20 p-4 ring-1 ring-foreground/5"
              >
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Fill: chart / table</p>
                <Skeleton className="mt-4 flex-1 rounded-lg" />
              </div>
            )
          )}
        </div>
      </section>

      <section data-slot="team-staffing-grid" aria-labelledby="team-staffing-heading">
        <h2
          id="team-staffing-heading"
          className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Staffing grid
        </h2>
        <div className="rounded-xl border border-border bg-card/10 p-4 ring-1 ring-foreground/5">
          <p className="text-xs text-muted-foreground">Fill: TanStack table — person-level rows</p>
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
          <Skeleton className="mt-2 h-64 w-full rounded-lg" />
        </div>
      </section>
    </div>
  )
}
