import {
  KPI_METRICS_GRID_CLASS,
  KpiMetricCard,
  KpiMetricSubline,
} from '@/components/dashboard/kpi-metric-card'
import { fmtHeadcountKpi } from '@/lib/overview/overview-metrics'
import type { TeamsOverviewPayload } from '@/lib/teams/overview/load-teams-overview'

function fmtTenureMonths(months: number | null): string {
  if (months === null || Number.isNaN(months)) return '—'
  return `${fmtHeadcountKpi(months)} mo`
}

export function TeamsOverviewKpiSection({ data }: { data: TeamsOverviewPayload }) {
  return (
    <section className="space-y-3" data-slot="teams-overview-kpis">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Organization snapshot
      </p>
      <div className={`${KPI_METRICS_GRID_CLASS} lg:grid-cols-4`}>
        <KpiMetricCard
          label="Headcount"
          value={fmtHeadcountKpi(data.headcount)}
          subline={
            <KpiMetricSubline>
              Planning roster from <code className="font-mono text-[0.65rem]">fact_capacity</code>
            </KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Active roles"
          value={fmtHeadcountKpi(data.activeRoleCount)}
          subline={
            <KpiMetricSubline>Distinct stamped month roles on the roster</KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Locations"
          value={fmtHeadcountKpi(data.locationCount)}
          subline={
            <KpiMetricSubline>Distinct holiday zones assigned to roster members</KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Avg tenure"
          value={fmtTenureMonths(data.avgTenureMonths)}
          subline={
            <KpiMetricSubline>
              Mean months since hire date for roster members with hire date
            </KpiMetricSubline>
          }
        />
      </div>
    </section>
  )
}
