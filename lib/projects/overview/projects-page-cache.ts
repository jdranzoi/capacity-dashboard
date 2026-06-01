import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'

export type ProjectsMonthSelectionResult = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption | null
  error: string | null
}

export const getProjectsMonthSelection = cache(
  async (monthStr: string | undefined): Promise<ProjectsMonthSelectionResult> => {
    const { options, error } = await loadOverviewMonthOptions()
    if (error) {
      return { options: [], selected: null, error }
    }
    const selected = resolveSelectedOverviewMonth(options, monthStr)
    return { options, selected, error: null }
  }
)

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
    monthStr: string | undefined
  ): Promise<{ data: ProjectsMonthContext | null; error: string | null }> => {
    const { options, selected, error } = await getProjectsMonthSelection(monthStr)
    if (error) {
      return { data: null, error }
    }
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
