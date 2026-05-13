import { roundDisplayStat } from '@/lib/format/display-stats'
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

export function fmtPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return '—'
  const i = roundDisplayStat(n)
  return `${i.toLocaleString('en-US', { maximumFractionDigits: 0 })}%`
}
