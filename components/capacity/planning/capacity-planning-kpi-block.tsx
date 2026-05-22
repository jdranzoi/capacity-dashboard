import {
  KPI_METRICS_GRID_CLASS,
  KpiMetricCard,
  KpiMetricSubline,
} from '@/components/dashboard/kpi-metric-card'
import type { CapacityPlanningPayload } from '@/lib/capacity/planning/load-capacity-planning'
import { PLANNED_KPI } from '@/lib/overview/capacity-kpi-contract'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'

export function CapacityPlanningKpiBlock({ data }: { data: CapacityPlanningPayload }) {
  const snapshotNote = 'Snapshot facts for reference month'
  const gap = data.planVsCapacityGapHours
  const gapSign = gap >= 0 ? '+' : ''

  return (
    <section className="space-y-3" data-slot="capacity-planning-kpis">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Planning position
      </p>
      <div className={`${KPI_METRICS_GRID_CLASS} xl:grid-cols-5`}>
        <KpiMetricCard
          label="Net capacity"
          value={fmtHoursKpi(data.netCapacityHours)}
          valueColorVar="--overview-metric-net"
          subline={<KpiMetricSubline>{snapshotNote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Planned hours"
          value={fmtHoursKpi(data.totalPlannedHours)}
          valueColorVar="--overview-metric-planned"
          subline={<KpiMetricSubline>{snapshotNote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label={PLANNED_KPI.label}
          value={fmtPct(data.plannedUtilizationPct ?? null)}
          subline={<KpiMetricSubline>{PLANNED_KPI.formulaFootnote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Projects planned"
          value={String(data.projectsWithPlansCount)}
          subline={<KpiMetricSubline>Projects with at least one plan line</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Unallocated capacity"
          value={`${gapSign}${fmtHoursKpi(gap)}`}
          subline={
            <KpiMetricSubline>
              {gap >= 0 ? 'Remaining unplanned capacity' : 'Over-committed vs net capacity'}
            </KpiMetricSubline>
          }
        />
      </div>
    </section>
  )
}
