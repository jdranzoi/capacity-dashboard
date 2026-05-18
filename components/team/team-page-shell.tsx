import { TeamAnalyticsGrid } from '@/components/team/team-analytics-grid'
import { TeamKpiSection } from '@/components/team/team-kpi-section'
import { TeamStaffingGrid } from '@/components/team/team-staffing-grid'
import { TeamToolbar } from '@/components/team/team-toolbar'
import { Button } from '@/components/ui/button'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { TeamFilterOptionsPayload } from '@/lib/team/load-team-filter-options'
import type { TeamMonthKpisPayload } from '@/lib/team/load-team-month-kpis'
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'
import type { TeamStaffingRow } from '@/lib/team/load-team-staffing-rows'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export function TeamPageShell({
  referenceMonthLabel,
  monthPicker,
  filterOptions,
  routeFilters,
  kpis,
  roleAnalyticsRows,
  staffingRows,
}: {
  referenceMonthLabel: string
  monthPicker: { options: OverviewMonthOption[]; selectedMonthKey: string } | null
  filterOptions: TeamFilterOptionsPayload
  routeFilters: TeamRouteFilters
  kpis: TeamMonthKpisPayload
  roleAnalyticsRows: TeamRoleAnalyticsRow[]
  staffingRows: TeamStaffingRow[]
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
        <TeamAnalyticsGrid
          rows={roleAnalyticsRows}
          staffingSlot={
            <TeamStaffingGrid
              rows={staffingRows}
              footnote={
                kpis.asOfDate
                  ? `Non-PTO logged and billable through ${kpis.asOfDate}; PTO through calendar month end (overview-aligned).`
                  : null
              }
            />
          }
        />
      </section>
    </div>
  )
}
