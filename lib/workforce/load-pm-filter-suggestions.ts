import type { SupabaseClient } from '@supabase/supabase-js'

import { PM_ROLE_KEY } from '@/lib/domain/role-keys'
import type { FilterSuggestOption } from '@/lib/format/filter-suggest-utils'
import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import {
  collectPmPersonIdsFromPlanRows,
  type ProjectPmPlanRow,
} from '@/lib/workforce/project-manager'

const BATCH = 200

async function loadPmRoleId(
  supabase: SupabaseClient<Database>
): Promise<{ pmRoleId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('dim_role')
    .select('id')
    .eq('key', PM_ROLE_KEY)
    .maybeSingle()

  if (error) return { pmRoleId: null, error: error.message }
  return { pmRoleId: data?.id ?? null, error: null }
}

async function loadPlanRowsForMonth(
  supabase: SupabaseClient<Database>,
  snapshotId: string,
  monthStartStr: string
): Promise<{ rows: ProjectPmPlanRow[]; error: string | null }> {
  const { rows, error } = await pagedQuery<ProjectPmPlanRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, project_id, role_id, planned_hours')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .not('project_id', 'is', null)
      .gt('planned_hours', 0)
      .order('project_id')
      .range(from, from + 999)
  )

  if (error) return { rows: [], error }

  return {
    rows: rows
      .filter((row) => row.project_id != null)
      .map((row) => ({
        person_id: row.person_id,
        project_id: row.project_id!,
        role_id: row.role_id,
        planned_hours: Number(row.planned_hours ?? 0),
      })),
    error: null,
  }
}

async function loadPersonNames(
  supabase: SupabaseClient<Database>,
  personIds: readonly string[]
): Promise<{ names: string[]; error: string | null }> {
  const names = new Set<string>()

  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)
    if (error) return { names: [], error: error.message }
    for (const row of data ?? []) {
      names.add(row.name)
    }
  }

  return {
    names: Array.from(names).sort((a, b) => a.localeCompare(b, 'en')),
    error: null,
  }
}

export async function loadPmFilterSuggestions(params: {
  snapshotId: string
  monthStartStr: string
}): Promise<{ options: FilterSuggestOption[]; error: string | null }> {
  const { snapshotId, monthStartStr } = params

  try {
    const supabase = createServiceClientCached()

    const [pmRoleRes, planRes] = await Promise.all([
      loadPmRoleId(supabase),
      loadPlanRowsForMonth(supabase, snapshotId, monthStartStr),
    ])

    if (pmRoleRes.error) return { options: [], error: pmRoleRes.error }
    if (planRes.error) return { options: [], error: planRes.error }

    const pmPersonIds = collectPmPersonIdsFromPlanRows(planRes.rows, pmRoleRes.pmRoleId)
    if (pmPersonIds.size === 0) {
      return { options: [], error: null }
    }

    const namesRes = await loadPersonNames(supabase, Array.from(pmPersonIds))
    if (namesRes.error) return { options: [], error: namesRes.error }

    return {
      options: namesRes.names.map((name) => ({ value: name, label: name })),
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load project manager suggestions.'
    return { options: [], error: message }
  }
}
