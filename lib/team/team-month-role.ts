import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const PAGE = 1000
const IN_BATCH = 200

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

/** First non-null `role_id` wins (ingestion stamps one role per person per month). */
function setFactMonthRole(
  roleByPerson: Map<string, string | null>,
  roster: ReadonlySet<string>,
  personId: string,
  roleId: string | null | undefined
): void {
  if (roleId == null || !roster.has(personId)) return
  if (!roleByPerson.has(personId)) {
    roleByPerson.set(personId, roleId)
  }
}

/**
 * Month role for `/team` roster people. Reads stamped `role_id` on snapshot facts (D-022);
 * no `dim_person_month_role` or `dim_person` — MCP keeps facts aligned with month role.
 *
 * Order: `fact_bench` (one row/person) → `fact_plans` for gaps → `fact_worklogs` for gaps.
 */
export async function fetchMonthRolesForPeople(
  supabase: SupabaseClient<Database>,
  params: {
    snapshotId: string
    monthStartStr: string
    monthEndStr: string
    personIds: readonly string[]
  }
): Promise<{ roleByPerson: Map<string, string | null>; error: string | null }> {
  const roster = new Set(params.personIds)
  const roleByPerson = new Map<string, string | null>()
  if (roster.size === 0) {
    return { roleByPerson, error: null }
  }

  const { snapshotId, monthStartStr, monthEndStr } = params

  const benchRes = await pagedQuery<{ person_id: string; role_id: string | null }>(async (from) =>
    supabase
      .from('fact_bench')
      .select('person_id, role_id')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .order('person_id')
      .range(from, from + PAGE - 1)
  )
  if (benchRes.error) return { roleByPerson, error: `fact_bench (role): ${benchRes.error}` }
  for (const r of benchRes.rows) {
    setFactMonthRole(roleByPerson, roster, r.person_id, r.role_id)
  }

  let missing = Array.from(roster).filter((pid) => !roleByPerson.has(pid))
  if (missing.length === 0) {
    return { roleByPerson, error: null }
  }

  const planRes = await pagedQuery<{ person_id: string; role_id: string | null }>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, role_id')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .order('person_id')
      .range(from, from + PAGE - 1)
  )
  if (planRes.error) return { roleByPerson, error: `fact_plans (role): ${planRes.error}` }
  const missingSet = new Set(missing)
  for (const r of planRes.rows) {
    if (!missingSet.has(r.person_id)) continue
    setFactMonthRole(roleByPerson, roster, r.person_id, r.role_id)
  }

  missing = missing.filter((pid) => !roleByPerson.has(pid))
  if (missing.length === 0) {
    return { roleByPerson, error: null }
  }

  for (let i = 0; i < missing.length; i += IN_BATCH) {
    const slice = missing.slice(i, i + IN_BATCH)
    const wlRes = await pagedQuery<{ person_id: string; role_id: string | null }>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, role_id')
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .in('person_id', slice)
        .order('person_id')
        .range(from, from + PAGE - 1)
    )
    if (wlRes.error) return { roleByPerson, error: `fact_worklogs (role): ${wlRes.error}` }
    for (const r of wlRes.rows) {
      setFactMonthRole(roleByPerson, roster, r.person_id, r.role_id)
    }
  }

  for (const pid of roster) {
    if (!roleByPerson.has(pid)) roleByPerson.set(pid, null)
  }

  return { roleByPerson, error: null }
}

export function personMatchesMonthRole(
  roleByPerson: Map<string, string | null>,
  personId: string,
  roleId: string
): boolean {
  return roleByPerson.get(personId) === roleId
}
