import { KpiMetricCard, KpiMetricSubline, KPI_METRICS_GRID_CLASS } from '@/components/ui/kpi-metric-card'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { TrainingKpis } from '@/lib/projects/training/training-types'

export function TrainingKpiRow({ kpis }: { kpis: TrainingKpis }) {
  const momSign = kpis.momDeltaHours > 0 ? '+' : ''

  return (
    <div className={KPI_METRICS_GRID_CLASS} data-slot="training-kpi-row">
      <KpiMetricCard
        label="Activities"
        value={String(kpis.activityCount)}
        subline={
          <KpiMetricSubline>
            {kpis.inProgressCount} in progress · {kpis.todoCount} to do · {kpis.doneCount} done
          </KpiMetricSubline>
        }
      />
      <KpiMetricCard
        label="Logged this month"
        value={fmtHoursKpi(kpis.loggedHoursMonth)}
        subline={<KpiMetricSubline>Tempo hours on child tickets</KpiMetricSubline>}
      />
      <KpiMetricCard
        label="vs last month"
        value={
          kpis.momDeltaHours === 0
            ? '—'
            : `${momSign}${fmtHoursKpi(Math.abs(kpis.momDeltaHours))}`
        }
        subline={
          <KpiMetricSubline>
            {kpis.momDeltaPct == null ? 'No prior-month hours' : `${fmtPct(kpis.momDeltaPct)} change`}
          </KpiMetricSubline>
        }
      />
      <KpiMetricCard
        label="Hours vs estimate"
        value={kpis.fillPct == null ? '—' : fmtPct(kpis.fillPct)}
        subline={
          <KpiMetricSubline>
            {kpis.estimatedActivityCount} estimated · {kpis.missingEstimateCount} missing estimate
          </KpiMetricSubline>
        }
      />
      <KpiMetricCard
        label="In progress"
        value={String(kpis.inProgressCount)}
        subline={<KpiMetricSubline>Current Jira status snapshot</KpiMetricSubline>}
      />
    </div>
  )
}
