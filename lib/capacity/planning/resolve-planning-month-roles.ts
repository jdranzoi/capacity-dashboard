import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { fetchMonthRolesForPeople } from '@/lib/workforce/month-role'

const IN_BATCH = 200

/**
 * Month role for Capacity Planning grouping.
 *
 * Primary: stamped `role_id` on snapshot facts (D-022) via {@link fetchMonthRolesForPeople}.
 * Fallback when facts lack a role (e.g. future months with capacity but no plans/worklogs yet):
 * `dim_person_month_role` for the month, then `dim_person.role_id`.
 */
export async function fetchPlanningMonthRolesForPeople(
  supabase: SupabaseClient<Database>,
  params: {
    snapshotId: string
    monthStartStr: string
    monthEndStr: string
    personIds: readonly string[]
  }
): Promise<{ roleByPerson: Map<string, string | null>; error: string | null }> {
  const { roleByPerson, error } = await fetchMonthRolesForPeople(supabase, params)
  if (error) return { roleByPerson, error }

  const roster = new Set(params.personIds)
  let missing = Array.from(roster).filter((pid) => roleByPerson.get(pid) == null)
  if (missing.length === 0) return { roleByPerson, error: null }

  const { monthStartStr } = params
  for (let i = 0; i < missing.length; i += IN_BATCH) {
    const slice = missing.slice(i, i + IN_BATCH)
    const { data, error: monthRoleErr } = await supabase
      .from('dim_person_month_role')
      .select('person_id, role_id')
      .eq('month_date', monthStartStr)
      .in('person_id', slice)
    if (monthRoleErr) {
      return { roleByPerson, error: `dim_person_month_role: ${monthRoleErr.message}` }
    }
    for (const row of data ?? []) {
      if (roleByPerson.get(row.person_id) == null) {
        roleByPerson.set(row.person_id, row.role_id)
      }
    }
  }

  missing = missing.filter((pid) => roleByPerson.get(pid) == null)
  if (missing.length === 0) return { roleByPerson, error: null }

  for (let i = 0; i < missing.length; i += IN_BATCH) {
    const slice = missing.slice(i, i + IN_BATCH)
    const { data, error: personErr } = await supabase
      .from('dim_person')
      .select('id, role_id')
      .in('id', slice)
    if (personErr) {
      return { roleByPerson, error: `dim_person (role): ${personErr.message}` }
    }
    for (const row of data ?? []) {
      if (row.role_id != null && roleByPerson.get(row.id) == null) {
        roleByPerson.set(row.id, row.role_id)
      }
    }
  }

  return { roleByPerson, error: null }
}
