import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'
import { teamRouteFiltersActive } from '@/lib/team/team-route-filters'

const PAGE = 1000

type PagedResult<T> = { rows: T[]; error: string | null }

async function pagedQuery<T>(
  run: (from: number) => Promise<{ data: unknown; error: { message: string } | null }>
): Promise<PagedResult<T>> {
  const rows: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await run(from)
    if (error) return { rows: [], error: error.message }
    const batch = (data as T[] | null) ?? []
    rows.push(...batch)
    if (batch.length < PAGE) break
    from += PAGE
  }
  return { rows, error: null }
}

async function loadCapacityPersonIds(
  supabase: SupabaseClient,
  snapshotId: string,
  monthStartStr: string
): Promise<{ ids: Set<string>; error: string | null }> {
  const { rows, error } = await pagedQuery<{ person_id: string }>(async (from) =>
    supabase
      .from('fact_capacity')
      .select('person_id')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .order('person_id')
      .range(from, from + PAGE - 1)
  )
  if (error) return { ids: new Set(), error }
  return { ids: new Set(rows.map((r) => r.person_id)), error: null }
}

/**
 * When any `/team` URL filter is active, returns the intersection with people who have
 * `fact_capacity` for the snapshot month. When no filter is active, returns `null` (full org).
 */
export async function resolveFilteredPersonIds(
  supabase: SupabaseClient<Database>,
  snapshotId: string,
  monthStartStr: string,
  monthEndStr: string,
  filters: TeamRouteFilters
): Promise<{ personIds: Set<string> | null; error: string | null }> {
  if (!teamRouteFiltersActive(filters)) {
    return { personIds: null, error: null }
  }

  const cap = await loadCapacityPersonIds(supabase, snapshotId, monthStartStr)
  if (cap.error) {
    return { personIds: null, error: cap.error }
  }
  let working = cap.ids

  let roleId: string | null = null
  if (filters.roleKey) {
    const { data, error } = await supabase
      .from('dim_role')
      .select('id')
      .eq('key', filters.roleKey)
      .maybeSingle()
    if (error) return { personIds: null, error: error.message }
    if (!data?.id) return { personIds: new Set(), error: null }
    roleId = data.id
  }

  let zoneId: string | null = null
  if (filters.zoneKey) {
    const { data, error } = await supabase
      .from('dim_zone')
      .select('id')
      .eq('key', filters.zoneKey)
      .maybeSingle()
    if (error) return { personIds: null, error: error.message }
    if (!data?.id) return { personIds: new Set(), error: null }
    zoneId = data.id
  }

  if (filters.roleKey || filters.zoneKey) {
    const list = Array.from(working)
    const next = new Set<string>()
    const BATCH = 200
    for (let i = 0; i < list.length; i += BATCH) {
      const slice = list.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from('dim_person')
        .select('id, role_id, zone_id')
        .in('id', slice)
      if (error) return { personIds: null, error: error.message }
      for (const row of data ?? []) {
        if (roleId && row.role_id !== roleId) continue
        if (zoneId && row.zone_id !== zoneId) continue
        next.add(row.id)
      }
    }
    working = next
  }

  if (filters.projectKey) {
    const { data: projectRows, error: projectErr } = await supabase
      .from('dim_project')
      .select('id')
      .eq('project_key', filters.projectKey)
    if (projectErr) return { personIds: null, error: projectErr.message }
    const projectIds = (projectRows ?? []).map((r) => r.id).filter(Boolean)
    if (projectIds.length === 0) {
      return { personIds: new Set(), error: null }
    }

    const PROJ_IN_BATCH = 80
    const fromPlans = new Set<string>()
    for (let i = 0; i < projectIds.length; i += PROJ_IN_BATCH) {
      const slice = projectIds.slice(i, i + PROJ_IN_BATCH)
      const { rows: planPeople, error: planErr } = await pagedQuery<{ person_id: string }>(
        async (from) =>
          supabase
            .from('fact_plans')
            .select('person_id')
            .eq('snapshot_id', snapshotId)
            .eq('month_date', monthStartStr)
            .eq('is_pto', false)
            .in('project_id', slice)
            .order('person_id')
            .range(from, from + PAGE - 1)
      )
      if (planErr) return { personIds: null, error: planErr }
      for (const r of planPeople) fromPlans.add(r.person_id)
    }

    const fromLogs = new Set<string>()
    for (let i = 0; i < projectIds.length; i += PROJ_IN_BATCH) {
      const slice = projectIds.slice(i, i + PROJ_IN_BATCH)
      const { rows: logPeople, error: logErr } = await pagedQuery<{ person_id: string }>(
        async (from) =>
          supabase
            .from('fact_worklogs')
            .select('person_id')
            .gte('log_date', monthStartStr)
            .lte('log_date', monthEndStr)
            .in('project_id', slice)
            .order('person_id')
            .range(from, from + PAGE - 1)
      )
      if (logErr) return { personIds: null, error: logErr }
      for (const r of logPeople) fromLogs.add(r.person_id)
    }

    const touched = new Set<string>([...fromPlans, ...fromLogs])
    const next = new Set<string>()
    for (const id of working) {
      if (touched.has(id)) next.add(id)
    }
    working = next
  }

  return { personIds: working, error: null }
}
