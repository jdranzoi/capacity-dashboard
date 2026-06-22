import type { SupabaseClient } from '@supabase/supabase-js'

import { PM_ROLE_KEY } from '@/lib/domain/role-keys'
import type { Database } from '@/lib/supabase/database.types'
import {
  buildPmNamesByProjectId,
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

async function loadPersonNamesById(
  supabase: SupabaseClient<Database>,
  personIds: readonly string[]
): Promise<{ namesById: Map<string, string>; error: string | null }> {
  const namesById = new Map<string, string>()

  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)
    if (error) return { namesById, error: error.message }
    for (const row of data ?? []) {
      namesById.set(row.id, row.name)
    }
  }

  return { namesById, error: null }
}

export async function resolvePmNamesByProjectFromPlanRows(
  supabase: SupabaseClient<Database>,
  planRows: readonly ProjectPmPlanRow[]
): Promise<{ pmNamesByProjectId: Map<string, string | null>; error: string | null }> {
  const pmRoleRes = await loadPmRoleId(supabase)
  if (pmRoleRes.error) {
    return { pmNamesByProjectId: new Map(), error: pmRoleRes.error }
  }

  const pmPersonIds = collectPmPersonIdsFromPlanRows(planRows, pmRoleRes.pmRoleId)
  if (pmPersonIds.size === 0) {
    return { pmNamesByProjectId: new Map(), error: null }
  }

  const namesRes = await loadPersonNamesById(supabase, Array.from(pmPersonIds))
  if (namesRes.error) {
    return { pmNamesByProjectId: new Map(), error: namesRes.error }
  }

  return {
    pmNamesByProjectId: buildPmNamesByProjectId({
      planRows,
      pmRoleId: pmRoleRes.pmRoleId,
      namesById: namesRes.namesById,
    }),
    error: null,
  }
}
