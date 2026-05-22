import {
  KPI_METRICS_GRID_CLASS,
  KpiMetricCard,
  KpiMetricSubline,
} from '@/components/dashboard/kpi-metric-card'
import {
  CAPACITY_FILL_KPI,
  UTILIZATION_KPI,
} from '@/lib/overview/capacity-kpi-contract'
import type { UtilizationMonthKpisPayload } from '@/lib/capacity/utilization/load-month-kpis'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { ReactNode } from 'react'

type TeamKpiItem = {
  label: string
  value: ReactNode
  subline: ReactNode
  valueColorVar?: string
}

export function UtilizationKpiSection({ kpis }: { kpis: UtilizationMonthKpisPayload }) {
  const { rollupHours: r, asOfDate, projectScopedHours: scoped } = kpis
  const mtdNote = asOfDate ? 'Non-PTO worklogs' : 'Overview worklog bound'
  const snapshotNote = 'Snapshot facts for reference month'
  const plannedHours = scoped?.plannedHours ?? r.plannedHours
  const loggedHours = scoped?.loggedHoursMtd ?? r.loggedHoursMtd
  const billableHours = scoped?.billableHoursMtd ?? r.billableHoursMtd
  const plannedFootnote = scoped
    ? `${snapshotNote} Selected project only (non-PTO plans).`
    : snapshotNote
  const logBillFootnote = scoped ? `${mtdNote} Selected project only.` : mtdNote
  const commercialFootnote = scoped
    ? `${mtdNote} Selected project only (commercial flag on worklog).`
    : 'Non-PTO worklogs stamped commercial at sync (Jira commercial category).'
  const nonCommercialFootnote = scoped
    ? `${mtdNote} Selected project only (commercial flag on worklog).`
    : 'Non-PTO worklogs stamped non-commercial at sync.'
  const utilizationCapacityFootnote = scoped
    ? 'Logged on selected project / monthly net capacity (filtered people).'
    : CAPACITY_FILL_KPI.formulaFootnote
  const utilizationPaceFootnote = scoped
    ? 'Mean of people: all non-PTO logs through as-of (not limited to selected project).'
    : UTILIZATION_KPI.formulaFootnote
  const efficiencyFootnote =
    kpis.billableEfficiencyPct === null
      ? '— when logged hours are zero'
      : scoped
        ? `${mtdNote} Selected project only.`
        : mtdNote

  const items: TeamKpiItem[] = [
    {
      label: 'Net capacity (MTD)',
      value: fmtHoursKpi(r.netCapacityHours),
      valueColorVar: '--overview-metric-net',
      subline: <KpiMetricSubline>{snapshotNote}</KpiMetricSubline>,
    },
    {
      label: 'Planned (MTD)',
      value: fmtHoursKpi(plannedHours),
      valueColorVar: '--overview-metric-planned',
      subline: <KpiMetricSubline>{plannedFootnote}</KpiMetricSubline>,
    },
    {
      label: 'PTO (MTD)',
      value: fmtHoursKpi(r.ptoHoursMonth),
      valueColorVar: '--overview-metric-pto',
      subline: <KpiMetricSubline>PTO worklogs</KpiMetricSubline>,
    },
    {
      label: 'Logged (MTD)',
      value: fmtHoursKpi(loggedHours),
      valueColorVar: '--overview-metric-logged',
      subline: <KpiMetricSubline>{logBillFootnote}</KpiMetricSubline>,
    },
    {
      label: 'Billable (MTD)',
      value: fmtHoursKpi(billableHours),
      valueColorVar: '--overview-metric-billable',
      subline: <KpiMetricSubline>{logBillFootnote}</KpiMetricSubline>,
    },
    {
      label: 'Non-commercial hours (MTD)',
      value: fmtHoursKpi(kpis.nonCommercialLoggedHoursMtd),
      valueColorVar: '--overview-metric-logged',
      subline: <KpiMetricSubline>{nonCommercialFootnote}</KpiMetricSubline>,
    },
    {
      label: 'Commercial hours (MTD)',
      value: fmtHoursKpi(kpis.commercialLoggedHoursMtd),
      valueColorVar: '--overview-metric-billable',
      subline: <KpiMetricSubline>{commercialFootnote}</KpiMetricSubline>,
    },
    {
      label: CAPACITY_FILL_KPI.label,
      value: fmtPct(kpis.capacityFillPct ?? null),
      subline: <KpiMetricSubline>{utilizationCapacityFootnote}</KpiMetricSubline>,
    },
    {
      label: UTILIZATION_KPI.label,
      value: fmtPct(kpis.utilizationPct ?? null),
      subline: <KpiMetricSubline>{utilizationPaceFootnote}</KpiMetricSubline>,
    },
    {
      label: 'Billable efficiency',
      value: fmtPct(kpis.billableEfficiencyPct ?? null),
      subline: <KpiMetricSubline>{efficiencyFootnote}</KpiMetricSubline>,
    },
  ]

  return (
    <section data-slot="team-kpis" aria-labelledby="team-kpis-heading">
      <h2
        id="team-kpis-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Current operations
      </h2>
      <div className={KPI_METRICS_GRID_CLASS}>
        {items.map((item) => (
          <KpiMetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            valueColorVar={item.valueColorVar}
            subline={item.subline}
          />
        ))}
      </div>
    </section>
  )
}
