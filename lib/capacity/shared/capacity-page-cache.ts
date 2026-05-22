import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import {
  capacityFiltersForPersonScope,
  type CapacityRouteFilters,
} from '@/lib/capacity/shared/capacity-route-filters'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadTeamFilterOptions, type TeamFilterOptionsPayload } from '@/lib/team/load-team-filter-options'
import { resolveFilteredPersonIds } from '@/lib/team/resolve-filtered-person-ids'

export type CapacityMonthSelectionResult = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption | null
  error: string | null
}

export const getCapacityMonthSelection = cache(
  async (monthStr: string | undefined): Promise<CapacityMonthSelectionResult> => {
    const { options, error } = await loadOverviewMonthOptions()
    if (error) {
      return { options: [], selected: null, error }
    }
    const selected = resolveSelectedOverviewMonth(options, monthStr)
    return { options, selected, error: null }
  }
)

export type CapacityMonthContext = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption
  filterOptions: TeamFilterOptionsPayload
  personIds: Set<string> | null
  snapshot: { id: string; createdAt: string }
  monthEndStr: string
}

export const getCapacityMonthContext = cache(
  async (
    monthStr: string | undefined,
    routeFilters: CapacityRouteFilters
  ): Promise<{ data: CapacityMonthContext | null; error: string | null }> => {
    const { options, selected, error } = await getCapacityMonthSelection(monthStr)
    if (error) {
      return { data: null, error }
    }
    if (!selected) {
      return { data: null, error: null }
    }

    const supabase = createServiceClientCached()
    const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
    const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
    const snapshot = { id: selected.snapshotId, createdAt: selected.syncCreatedAt }

    const [filterOptionsResult, personIdsResult] = await Promise.all([
      loadTeamFilterOptions(selected.snapshotId, selected.monthStartStr),
      resolveFilteredPersonIds(
        supabase,
        selected.snapshotId,
        selected.monthStartStr,
        monthEndStr,
        capacityFiltersForPersonScope(routeFilters)
      ),
    ])

    if (filterOptionsResult.error || !filterOptionsResult.data) {
      return {
        data: null,
        error: filterOptionsResult.error ?? 'Could not load capacity filters.',
      }
    }
    if (personIdsResult.error) {
      return { data: null, error: personIdsResult.error }
    }

    return {
      data: {
        options,
        selected,
        filterOptions: filterOptionsResult.data,
        personIds: personIdsResult.personIds,
        snapshot,
        monthEndStr,
      },
      error: null,
    }
  }
)
