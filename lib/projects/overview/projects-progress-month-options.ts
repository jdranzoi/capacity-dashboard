import { format, parse, startOfMonth } from 'date-fns'

import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { ProjectsCategoryFilter } from '@/lib/projects/overview/projects-route-filters'

/** Rolling month picker on the progress chart (support / internal). */
export const PROJECTS_PROGRESS_MONTH_COUNT = 3

export function usesProjectsProgressMonthPicker(
  category: ProjectsCategoryFilter
): category is 'support' | 'internal' {
  return category === 'support' || category === 'internal'
}

/** Last `count` calendar months, oldest → newest (for left-to-right segmented control). */
export function pickRecentMonthOptions(
  options: OverviewMonthOption[],
  count = PROJECTS_PROGRESS_MONTH_COUNT
): OverviewMonthOption[] {
  return options.slice(0, count).reverse()
}

/** Short month label for the segmented control (e.g. "June"). */
export function formatProgressMonthToggleLabel(monthStartStr: string): string {
  const d = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  return format(d, 'MMMM')
}

/**
 * Resolves the selected month within the progress-chart window (support / internal).
 * Defaults to the current calendar month when present, else the newest option.
 */
export function resolveProjectsProgressMonth(
  recentOptions: OverviewMonthOption[],
  monthParam: string | undefined
): OverviewMonthOption | null {
  if (recentOptions.length === 0) return null
  if (monthParam) {
    const hit = recentOptions.find((o) => o.monthKey === monthParam)
    if (hit) return hit
  }
  const currentKey = format(startOfMonth(new Date()), 'yyyy-MM')
  return recentOptions.find((o) => o.monthKey === currentKey) ?? recentOptions[0]
}

export function resolveMonthForProjectsCategory(
  options: OverviewMonthOption[],
  monthParam: string | undefined,
  category: ProjectsCategoryFilter
): OverviewMonthOption | null {
  if (usesProjectsProgressMonthPicker(category)) {
    return resolveProjectsProgressMonth(pickRecentMonthOptions(options), monthParam)
  }
  if (monthParam) {
    const hit = options.find((o) => o.monthKey === monthParam)
    if (hit) return hit
  }
  const currentKey = format(startOfMonth(new Date()), 'yyyy-MM')
  return options.find((o) => o.monthKey === currentKey) ?? options[0] ?? null
}
