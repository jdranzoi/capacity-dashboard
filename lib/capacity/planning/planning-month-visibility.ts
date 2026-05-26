export const PLANNING_MONTH_VISIBILITY_ALL = 'all' as const

export type MonthVisibilitySegmentOption = { value: string; label: string }
export type PlanningMonthVisibilityFilter = typeof PLANNING_MONTH_VISIBILITY_ALL | string

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function shortMonthLabel(monthKey: string, monthLabels: Record<string, string>): string {
  const full = monthLabels[monthKey]?.trim()
  if (full) {
    const token = full.split(/\s+/)[0]
    if (token) return token
  }
  const month = Number(monthKey.slice(5, 7))
  return SHORT_MONTHS[month - 1] ?? monthKey
}

export function buildMonthVisibilitySegmentOptions(
  monthKeys: string[],
  monthLabels: Record<string, string>
): MonthVisibilitySegmentOption[] {
  return [
    { value: PLANNING_MONTH_VISIBILITY_ALL, label: 'All' },
    ...monthKeys.map((monthKey) => ({
      value: monthKey,
      label: shortMonthLabel(monthKey, monthLabels),
    })),
  ]
}

export function resolveVisibleMonthKeys(
  monthKeys: string[],
  filter: PlanningMonthVisibilityFilter
): string[] {
  if (filter === PLANNING_MONTH_VISIBILITY_ALL) return monthKeys
  return monthKeys.includes(filter) ? [filter] : monthKeys
}

export function normalizeMonthVisibilityFilter(
  monthKeys: string[],
  filter: PlanningMonthVisibilityFilter
): PlanningMonthVisibilityFilter {
  if (filter === PLANNING_MONTH_VISIBILITY_ALL) return filter
  return monthKeys.includes(filter) ? filter : PLANNING_MONTH_VISIBILITY_ALL
}
