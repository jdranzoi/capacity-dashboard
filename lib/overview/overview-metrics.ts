import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'

export const OVERVIEW_METRIC_ROWS = [
  {
    key: 'netCapacityHours' as const,
    label: 'Net capacity',
    worklog: false,
    cssVar: '--overview-metric-net' as const,
  },
  {
    key: 'plannedHours' as const,
    label: 'Planned',
    worklog: false,
    cssVar: '--overview-metric-planned' as const,
  },
  {
    key: 'availabilityHours' as const,
    label: 'Availability',
    worklog: false,
    cssVar: '--overview-metric-availability' as const,
  },
  {
    key: 'ptoHours' as const,
    label: 'PTO',
    worklog: true,
    cssVar: '--overview-metric-pto' as const,
  },
  {
    key: 'billableHours' as const,
    label: 'Billable',
    worklog: true,
    cssVar: '--overview-metric-billable' as const,
  },
  {
    key: 'loggedHours' as const,
    label: 'Logged',
    worklog: true,
    cssVar: '--overview-metric-logged' as const,
  },
] as const

export type OverviewMetricKey = (typeof OVERVIEW_METRIC_ROWS)[number]['key']

/** Bars in the weekly evolution chart (logged is drawn as a line). */
export const OVERVIEW_CHART_BAR_KEYS = [
  'netCapacityHours',
  'plannedHours',
  'availabilityHours',
  'ptoHours',
  'billableHours',
] as const satisfies readonly OverviewMetricKey[]

export function sumMetricTotals(
  weeks: WeeklyHeadline[],
  key: OverviewMetricKey
): number {
  return Math.round(weeks.reduce((s, w) => s + w[key], 0) * 10) / 10
}

export function fmtHoursCell(n: number): string {
  return n === 0 ? '—' : `${n}h`
}

export function fmtHoursKpi(n: number): string {
  if (n === 0) return '—'
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}h`
}

export function fmtPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return '—'
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
}

/**
 * Weekly-detail table utilization (org roll-up): billable hours vs prorated net capacity for that ISO week.
 *
 * Same billable-vs-capacity relationship as C-005 `fullMonthUtilization` when the denominator is the month's
 * net capacity allocated to that week via Mon-Fri overlap weights (`prorate-to-weeks`), not the full-month total.
 *
 * - UI shows "—" when either input is non-positive (matches treating zero billable hours as empty in the table).
 * - MTD total column: `(sum billable) / (sum net capacity) * 100`, not the average of weekly percentages.
 *
 * Distinct from `mtdUtilizationAvgPct` in `loadWeeklyOverview`: mean of per-person `(logged / elapsedWeekdays / 8) * 100`.
 *
 * @see lib/domain/utilization.ts — C-005
 * @see CLAUDE.md — Overview weekly metrics, Weekly detail table (Utilization)
 */
export function overviewWeeklyBillableUtilizationPct(
  billableHours: number,
  netCapacityHours: number
): number | null {
  if (billableHours <= 0 || netCapacityHours <= 0) return null
  return Math.round((billableHours / netCapacityHours) * 1000) / 10
}
