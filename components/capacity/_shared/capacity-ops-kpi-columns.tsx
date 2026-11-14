import {
  CAPACITY_FILL_KPI,
  COMMERCIAL_UTILIZATION_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import { plannedPct } from '@/lib/domain/workload-metrics'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { CSSProperties } from 'react'

export type CapacityOpsKpiValues = {
  netCapacityHours: number
  elapsedCapacityHours: number
  plannedHours: number
  ptoHoursMonth: number
  loggedHoursMtd: number
  nonCommercialLoggedHoursMtd: number
  commercialLoggedHoursMtd: number
  capacityFillPct: number | null
  utilizationPct: number | null
  commercialUtilizationPct: number | null
  asOfDate: string | null
  projectScoped: boolean
}

type CompactKpiCardData = {
  label: string
  value: string
  note: string
  valueColorVar?: string
  sharePct?: number | null
}

export function CapacityOpsKpiColumns({
  values,
  showColumnTitles = true,
}: {
  values: CapacityOpsKpiValues
  showColumnTitles?: boolean
}) {
  const columns = buildColumns(values)

  return (
    <section data-slot="capacity-ops-kpis" aria-label="Capacity KPIs">
      <div className="grid items-stretch gap-2 lg:grid-cols-3">
        <KpiCardColumn title={showColumnTitles ? 'Capacity' : undefined} cards={columns.capacity} />
        <KpiCardColumn title={showColumnTitles ? 'Hours (MTD)' : undefined} cards={columns.hours} />
        <KpiCardColumn title={showColumnTitles ? 'Metrics' : undefined} cards={columns.metrics} />
      </div>
    </section>
  )
}

function buildColumns(values: CapacityOpsKpiValues): {
  capacity: CompactKpiCardData[]
  hours: CompactKpiCardData[]
  metrics: CompactKpiCardData[]
} {
  const mtdNote = values.asOfDate ? 'Non-PTO worklogs' : 'Overview worklog bound'
  const monthSnapshotNote = 'Full-month snapshot'
  const scoped = values.projectScoped
  const elapsedSharePct = plannedPct(values.elapsedCapacityHours, values.netCapacityHours)
  const plannedSharePct = plannedPct(values.plannedHours, values.netCapacityHours)

  const plannedNote = scoped
    ? `${monthSnapshotNote} Selected project only (delivery plans).`
    : monthSnapshotNote
  const logNote = scoped ? `${mtdNote} Selected project only.` : mtdNote
  const commercialNote = scoped
    ? `${mtdNote} Selected project only (commercial flag on worklog).`
    : 'Stamped commercial at sync (Jira category).'
  const nonCommercialNote = scoped
    ? `${mtdNote} Selected project only (commercial flag on worklog).`
    : 'Stamped non-commercial at sync.'
  const capacityFillNote = scoped
    ? 'Logged on selected project / monthly net capacity (filtered people).'
    : CAPACITY_FILL_KPI.formulaFootnote
  const utilizationNote = scoped
    ? 'All logged hours of the filtered people through as-of / their elapsed capacity (not limited to selected project).'
    : UTILIZATION_KPI.formulaFootnote
  const commercialUtilizationNote =
    values.commercialUtilizationPct === null
      ? '— when commercial hours or elapsed capacity are zero'
      : scoped
        ? 'Commercial hours on selected project / elapsed capacity (filtered people).'
        : COMMERCIAL_UTILIZATION_KPI.formulaFootnote

  return {
    capacity: [
      {
        label: 'Net capacity',
        value: fmtHoursKpi(values.netCapacityHours),
        valueColorVar: '--overview-metric-net',
        note: monthSnapshotNote,
      },
      {
        label: 'Elapsed capacity',
        value: fmtHoursKpi(values.elapsedCapacityHours),
        valueColorVar: '--overview-metric-net',
        note: 'Working days elapsed × 8h (holidays and PTO removed)',
        sharePct: elapsedSharePct,
      },
      {
        label: 'Planned',
        value: fmtHoursKpi(values.plannedHours),
        valueColorVar: '--overview-metric-planned',
        note: plannedNote,
        sharePct: plannedSharePct,
      },
      {
        label: 'PTO',
        value: fmtHoursKpi(values.ptoHoursMonth),
        valueColorVar: '--overview-metric-pto',
        note: 'Calendar month (includes upcoming PTO)',
      },
    ],
    hours: [
      {
        label: 'Logged',
        value: fmtHoursKpi(values.loggedHoursMtd),
        valueColorVar: '--overview-metric-logged',
        note: logNote,
      },
      {
        label: 'Non-commercial hours',
        value: fmtHoursKpi(values.nonCommercialLoggedHoursMtd),
        valueColorVar: '--overview-metric-logged',
        note: nonCommercialNote,
      },
      {
        label: 'Commercial hours',
        value: fmtHoursKpi(values.commercialLoggedHoursMtd),
        valueColorVar: '--overview-metric-billable',
        note: commercialNote,
      },
    ],
    metrics: [
      {
        label: CAPACITY_FILL_KPI.label,
        value: fmtPct(values.capacityFillPct ?? null),
        note: capacityFillNote,
      },
      {
        label: UTILIZATION_KPI.label,
        value: fmtPct(values.utilizationPct ?? null),
        note: utilizationNote,
      },
      {
        label: COMMERCIAL_UTILIZATION_KPI.label,
        value: fmtPct(values.commercialUtilizationPct ?? null),
        note: commercialUtilizationNote,
      },
    ],
  }
}

function KpiCardColumn({
  title,
  cards,
}: {
  title?: string
  cards: CompactKpiCardData[]
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {title ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {cards.map((card) => (
          <CompactKpiCard key={card.label} card={card} />
        ))}
      </div>
    </div>
  )
}

function CompactKpiCard({ card }: { card: CompactKpiCardData }) {
  const valueStyle: CSSProperties | undefined = card.valueColorVar
    ? { color: `var(${card.valueColorVar})` }
    : undefined
  const share = card.sharePct != null ? fmtPct(card.sharePct) : null

  return (
    <div
      className={dashboardSurfaceClass(
        'flex min-h-0 flex-1 flex-col justify-center px-3 py-2'
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="shrink-0 text-xs font-medium text-muted-foreground">{card.label}</p>
        <p className="truncate text-[0.65rem] text-muted-foreground/50" title={card.note}>
          {card.note}
        </p>
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <p className="text-sm font-semibold tabular-nums tracking-tight" style={valueStyle}>
          {card.value}
        </p>
        {share ? (
          <p
            className="font-mono text-xs tabular-nums text-muted-foreground"
            title="Share of net capacity"
          >
            {share}
          </p>
        ) : null}
      </div>
    </div>
  )
}
