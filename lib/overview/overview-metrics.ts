import { fmtPct as _fmtPct, roundDisplayStat } from '@/lib/format/display-stats'
import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'

export const OVERVIEW_METRIC_ROWS = [
  {
    key: "netCapacityHours" as const,
    label: "Net capacity",
    worklog: false,
    cssVar: "--overview-metric-net" as const,
  },
  {
    key: "plannedHours" as const,
    label: "Planned",
    worklog: false,
    cssVar: "--overview-metric-planned" as const,
  },
  {
    key: "ptoHours" as const,
    label: "PTO",
    worklog: true,
    cssVar: "--overview-metric-pto" as const,
  },
  {
    key: "loggedHours" as const,
    label: "Logged",
    worklog: true,
    cssVar: "--overview-metric-logged" as const,
  },
  {
    key: "billableHours" as const,
    label: "Billable",
    worklog: true,
    cssVar: "--overview-metric-billable" as const,
  },
] as const;

export type OverviewMetricKey = (typeof OVERVIEW_METRIC_ROWS)[number]['key']

/** Bars in the weekly evolution chart (logged is drawn as a line). */
export const OVERVIEW_CHART_BAR_KEYS = [
  "netCapacityHours",
  "plannedHours",
  "ptoHours",
  "billableHours",
] as const satisfies readonly OverviewMetricKey[];

export function sumMetricTotals(
  weeks: WeeklyHeadline[],
  key: OverviewMetricKey
): number {
  return roundDisplayStat(weeks.reduce((s, w) => s + w[key], 0))
}

export function fmtHoursCell(n: number): string {
  return n === 0 ? '—' : `${roundDisplayStat(n)}h`
}

export function fmtHoursKpi(n: number): string {
  if (n === 0) return '—'
  const i = roundDisplayStat(n)
  return `${i.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}h`
}

/** Build detail KPI: cumulative plan variance for elapsed months. */
export function fmtPlanVarianceKpi(varianceHours: number | null): string {
  if (varianceHours == null) return '—'
  if (varianceHours === 0) return 'On plan'
  const magnitude = fmtHoursKpi(Math.abs(varianceHours))
  return varianceHours > 0 ? `${magnitude} under` : `${magnitude} over`
}

/** Whole-person counts (headline KPIs). */
export function fmtHeadcountKpi(n: number): string {
  const i = roundDisplayStat(n)
  return i.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** Display formatters — import from here in UI and loaders at the display boundary. */
export { roundDisplayStat } from '@/lib/format/display-stats'
export const fmtPct = _fmtPct
