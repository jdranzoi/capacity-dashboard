import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import { loadOverviewMonthOptions, type OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { resolveMonthForProjectsCategory } from '@/lib/projects/overview/projects-progress-month-options'
import type { ProjectsCategoryFilter } from '@/lib/projects/overview/projects-route-filters'

export type ProjectsMonthContext = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption
  snapshot: { id: string; createdAt: string }
  monthStartStr: string
  monthEndStr: string
  monthLabel: string // display label (e.g. May 2026)
}

export const getProjectsMonthContext = cache(
  async (
    monthStr: string | undefined,
    category: ProjectsCategoryFilter = 'build'
  ): Promise<{ data: ProjectsMonthContext | null; error: string | null }> => {
    const { options, error } = await loadOverviewMonthOptions()
    if (error) {
      return { data: null, error }
    }
    const selected = resolveMonthForProjectsCategory(options, monthStr, category)
    if (!selected) {
      return { data: null, error: null }
    }

    const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
    const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
    const snapshot = { id: selected.snapshotId, createdAt: selected.syncCreatedAt }

    return {
      data: {
        options,
        selected,
        snapshot,
        monthStartStr: selected.monthStartStr,
        monthEndStr,
        monthLabel: selected.label,
      },
      error: null,
    }
  }
)
