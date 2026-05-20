import { cache } from 'react'
import { parse } from 'date-fns'

import { loadWeeklyOverview, type WeeklyOverviewData } from '@/lib/overview/load-weekly-overview'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'

export type OverviewMonthSelectionResult = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption | null
  error: string | null
}

/** Cached month list + resolved `?month=` for the current RSC request. */
export const getOverviewMonthSelection = cache(
  async (monthParam: string | undefined): Promise<OverviewMonthSelectionResult> => {
    const { options, error } = await loadOverviewMonthOptions()
    if (error) {
      return { options: [], selected: null, error }
    }
    const selected = resolveSelectedOverviewMonth(options, monthParam)
    return { options, selected, error: null }
  }
)

/** Cached weekly overview payload for snapshot + month (dedupes bundle work per request). */
export const getOverviewWeeklyData = cache(
  async (
    monthStartStr: string,
    snapshotId: string,
    syncCreatedAt: string
  ): Promise<WeeklyOverviewData> => {
    const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
    return loadWeeklyOverview(referenceDate, undefined, {
      id: snapshotId,
      createdAt: syncCreatedAt,
    })
  }
)
