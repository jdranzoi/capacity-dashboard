import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { TEAMS_MONTH_HORIZON } from '@/lib/teams/shared/teams-month-horizon'

export type TeamsMonthSelectionResult = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption | null
  error: string | null
}

export const getTeamsMonthSelection = cache(
  async (monthStr: string | undefined): Promise<TeamsMonthSelectionResult> => {
    const { options, error } = await loadOverviewMonthOptions(TEAMS_MONTH_HORIZON)
    if (error) {
      return { options: [], selected: null, error }
    }
    const selected = resolveSelectedOverviewMonth(options, monthStr)
    return { options, selected, error: null }
  }
)

export type TeamsMonthContext = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption
  snapshot: { id: string; createdAt: string }
  monthEndStr: string
}

export const getTeamsMonthContext = cache(
  async (
    monthStr: string | undefined
  ): Promise<{ data: TeamsMonthContext | null; error: string | null }> => {
    const { options, selected, error } = await getTeamsMonthSelection(monthStr)
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
        monthEndStr,
      },
      error: null,
    }
  }
)
