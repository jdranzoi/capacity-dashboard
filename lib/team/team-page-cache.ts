import { cache } from 'react'
import { endOfMonth, format, parse } from 'date-fns'

import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadTeamFilterOptions, type TeamFilterOptionsPayload } from '@/lib/team/load-team-filter-options'
import { loadTeamMonthKpis, type TeamMonthKpisPayload } from '@/lib/team/load-team-month-kpis'
import { loadTeamRoleAnalytics, type TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'
import { loadTeamStaffingRows, type TeamStaffingRow } from '@/lib/team/load-team-staffing-rows'
import { resolveFilteredPersonIds } from '@/lib/team/resolve-filtered-person-ids'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export type TeamMonthSelectionResult = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption | null
  error: string | null
}

export const getTeamMonthSelection = cache(
  async (monthStr: string | undefined): Promise<TeamMonthSelectionResult> => {
    const { options, error } = await loadOverviewMonthOptions()
    if (error) {
      return { options: [], selected: null, error }
    }
    const selected = resolveSelectedOverviewMonth(options, monthStr)
    return { options, selected, error: null }
  }
)

export type TeamPageBootstrap = {
  options: OverviewMonthOption[]
  selected: OverviewMonthOption
  filterOptions: TeamFilterOptionsPayload
  personIds: Set<string> | null
  snapshot: { id: string; createdAt: string }
  monthEndStr: string
}

export const getTeamPageBootstrap = cache(
  async (
    monthStr: string | undefined,
    roleKey: string | null,
    zoneKey: string | null,
    projectKey: string | null
  ): Promise<{ data: TeamPageBootstrap | null; error: string | null }> => {
    const routeFilters: TeamRouteFilters = { roleKey, zoneKey, projectKey }
    const { options, selected, error } = await getTeamMonthSelection(monthStr)
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
        routeFilters
      ),
    ])

    if (filterOptionsResult.error || !filterOptionsResult.data) {
      return {
        data: null,
        error: filterOptionsResult.error ?? 'Could not load team filters.',
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

export const getTeamMonthKpisCached = cache(
  async (
    monthStr: string | undefined,
    roleKey: string | null,
    zoneKey: string | null,
    projectKey: string | null
  ) => {
    const boot = await getTeamPageBootstrap(monthStr, roleKey, zoneKey, projectKey)
    if (boot.error) return { data: null, error: boot.error }
    if (!boot.data) return { data: null, error: 'No month selected.' }

    const routeFilters: TeamRouteFilters = { roleKey, zoneKey, projectKey }
    return loadTeamMonthKpis(
      boot.data.selected.monthStartStr,
      boot.data.snapshot,
      routeFilters,
      boot.data.personIds
    )
  }
)

export const getTeamRoleAnalyticsCached = cache(
  async (
    monthStr: string | undefined,
    roleKey: string | null,
    zoneKey: string | null,
    projectKey: string | null
  ) => {
    const boot = await getTeamPageBootstrap(monthStr, roleKey, zoneKey, projectKey)
    if (boot.error) return { data: null, error: boot.error }
    if (!boot.data) return { data: [], error: null }

    const supabase = createServiceClientCached()
    return loadTeamRoleAnalytics(supabase, {
      monthStartStr: boot.data.selected.monthStartStr,
      snapshot: boot.data.snapshot,
      personIdFilter: boot.data.personIds,
    })
  }
)

export const getTeamStaffingRowsCached = cache(
  async (
    monthStr: string | undefined,
    roleKey: string | null,
    zoneKey: string | null,
    projectKey: string | null
  ) => {
    const boot = await getTeamPageBootstrap(monthStr, roleKey, zoneKey, projectKey)
    if (boot.error) return { data: null, error: boot.error }
    if (!boot.data) return { data: [], error: null }

    const supabase = createServiceClientCached()
    return loadTeamStaffingRows(supabase, {
      monthStartStr: boot.data.selected.monthStartStr,
      snapshot: boot.data.snapshot,
      personIdFilter: boot.data.personIds,
    })
  }
)

export type { TeamMonthKpisPayload, TeamRoleAnalyticsRow, TeamStaffingRow }
