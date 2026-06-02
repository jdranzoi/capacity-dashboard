import {
  KpiMetricCard,
  KpiMetricSubline,
  KPI_METRICS_GRID_CLASS,
} from '@/components/dashboard/kpi-metric-card'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { ProjectsOverviewKpis } from '@/lib/projects/overview/projects-types'
import { cn } from '@/lib/utils'

export function ProjectsOverviewKpiSection({
  kpis,
  viewMode,
}: {
  kpis: ProjectsOverviewKpis
  viewMode: 'monthly' | 'global'
}) {
  const hoursScope = viewMode === 'monthly' ? 'MTD' : 'Lifetime'

  return (
    <section className="space-y-3" aria-label="Projects overview KPIs">
      <h2 className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        Portfolio snapshot
      </h2>
      <div className={cn(KPI_METRICS_GRID_CLASS, 'xl:grid-cols-6')}>
        <KpiMetricCard
          label="Total active projects"
          value={String(kpis.activeProjectCount)}
        />
        <KpiMetricCard
          label={`Total hours logged (${hoursScope})`}
          value={fmtHoursKpi(kpis.totalLoggedHours)}
        />
        <KpiMetricCard
          label={`Total hours planned (${hoursScope})`}
          value={fmtHoursKpi(kpis.totalPlannedHours)}
        />
        <KpiMetricCard
          label="Overall utilization"
          value={
            kpis.overallUtilizationPct != null
              ? fmtPct(kpis.overallUtilizationPct)
              : '—'
          }
          subline={
            <KpiMetricSubline>Logged vs planned (org roll-up)</KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Projects at risk"
          value={String(kpis.projectsAtRiskCount)}
          valueColorVar="--destructive"
          subline={
            <KpiMetricSubline>Budget used &gt; 115%</KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Burn rate"
          value={
            kpis.orgBurnRateHoursPerMonth != null
              ? `${fmtHoursKpi(kpis.orgBurnRateHoursPerMonth)}/mo`
              : '—'
          }
          subline={
            <KpiMetricSubline>Avg logged over last 3 months</KpiMetricSubline>
          }
        />
      </div>
    </section>
  )
}
