import {
  KPI_METRICS_GRID_CLASS,
  KpiMetricCard,
  KpiMetricSubline,
} from '@/components/ui/kpi-metric-card'
import type { CapacityOverviewPayload } from '@/lib/capacity/overview/load-capacity-overview'
import {
  CAPACITY_FILL_KPI,
  PLANNED_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'

export function CapacityOverviewKpiSection({ data }: { data: CapacityOverviewPayload }) {
  const r = data.orgMonthRollupHours
  const snapshotNote = 'Snapshot facts for reference month'
  const mtdNote = data.asOfDate ? `Non-PTO worklogs through ${data.asOfDate}` : 'Overview worklog bound'

  return (
    <section className="space-y-3" data-slot="capacity-overview-kpis">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Capacity position
      </p>
      <div className={`${KPI_METRICS_GRID_CLASS} xl:grid-cols-7`}>
        <KpiMetricCard
          label="Net capacity"
          value={fmtHoursKpi(r.netCapacityHours)}
          valueColorVar="--overview-metric-net"
          subline={<KpiMetricSubline>{snapshotNote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Planned (MTD)"
          value={fmtHoursKpi(r.plannedHours)}
          valueColorVar="--overview-metric-planned"
          subline={<KpiMetricSubline>{snapshotNote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Logged (MTD)"
          value={fmtHoursKpi(r.loggedHoursMtd)}
          valueColorVar="--overview-metric-logged"
          subline={<KpiMetricSubline>{mtdNote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Bench hours"
          value={fmtHoursKpi(data.benchHours)}
          subline={
            <KpiMetricSubline>
              {fmtHeadcountKpi(data.benchHeadcount)} on bench ·{' '}
              {fmtPct(data.benchRatePct ?? null)} of capacity
            </KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label={CAPACITY_FILL_KPI.label}
          value={fmtPct(data.capacityFillPct ?? null)}
          subline={<KpiMetricSubline>{CAPACITY_FILL_KPI.formulaFootnote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label={UTILIZATION_KPI.label}
          value={fmtPct(data.utilizationPct ?? null)}
          subline={<KpiMetricSubline>{UTILIZATION_KPI.formulaFootnote}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label={PLANNED_KPI.label}
          value={fmtPct(data.plannedPct ?? null)}
          subline={<KpiMetricSubline>{PLANNED_KPI.formulaFootnote}</KpiMetricSubline>}
        />
      </div>
    </section>
  )
}
