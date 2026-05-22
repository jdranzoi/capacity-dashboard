import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import {
  capacityFiltersForPersonScope,
  type CapacityRouteFilters,
} from '@/lib/capacity/shared/capacity-route-filters'
import { loadRoleAnalytics, type RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'
import {
  loadUtilizationMonthKpis,
  type UtilizationMonthKpisPayload,
} from '@/lib/capacity/utilization/load-month-kpis'
import {
  loadUtilizationStaffingRows,
  type UtilizationStaffingRow,
} from '@/lib/capacity/utilization/load-staffing-rows'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import {
  loadWorkforceFilterOptions,
  type WorkforceFilterOptionsPayload,
} from '@/lib/workforce/load-filter-options'
import { resolveFilteredPersonIds } from '@/lib/workforce/resolve-filtered-person-ids'

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
  filterOptions: WorkforceFilterOptionsPayload
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
      loadWorkforceFilterOptions(selected.snapshotId, selected.monthStartStr),
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

export const getUtilizationMonthKpisCached = cache(
  async (monthStr: string | undefined, routeFilters: CapacityRouteFilters) => {
    const ctx = await getCapacityMonthContext(monthStr, routeFilters)
    if (ctx.error) return { data: null, error: ctx.error }
    if (!ctx.data) return { data: null, error: 'No month selected.' }

    return loadUtilizationMonthKpis(
      ctx.data.selected.monthStartStr,
      ctx.data.snapshot,
      capacityFiltersForPersonScope(routeFilters),
      ctx.data.personIds
    )
  }
)

export const getUtilizationRoleAnalyticsCached = cache(
  async (monthStr: string | undefined, routeFilters: CapacityRouteFilters) => {
    const ctx = await getCapacityMonthContext(monthStr, routeFilters)
    if (ctx.error) return { data: null, error: ctx.error }
    if (!ctx.data) return { data: [], error: null }

    const supabase = createServiceClientCached()
    return loadRoleAnalytics(supabase, {
      monthStartStr: ctx.data.selected.monthStartStr,
      snapshot: ctx.data.snapshot,
      personIdFilter: ctx.data.personIds,
    })
  }
)

export const getUtilizationStaffingRowsCached = cache(
  async (monthStr: string | undefined, routeFilters: CapacityRouteFilters) => {
    const ctx = await getCapacityMonthContext(monthStr, routeFilters)
    if (ctx.error) return { data: null, error: ctx.error }
    if (!ctx.data) return { data: [], error: null }

    const supabase = createServiceClientCached()
    return loadUtilizationStaffingRows(supabase, {
      monthStartStr: ctx.data.selected.monthStartStr,
      snapshot: ctx.data.snapshot,
      personIdFilter: ctx.data.personIds,
    })
  }
)

export type { RoleAnalyticsRow, UtilizationMonthKpisPayload, UtilizationStaffingRow }
