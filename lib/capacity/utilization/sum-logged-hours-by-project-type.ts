import type { SupabaseClient } from '@supabase/supabase-js'

import { roundDisplayStat } from '@/lib/format/display-stats'
import type { Database } from '@/lib/supabase/database.types'

const PAGE = 1000
const PROJECT_ID_BATCH = 200

export type LoggedHoursByProjectType = {
  internalLoggedHoursMtd: number
  commercialLoggedHoursMtd: number
}

type WorklogSlice = {
  project_id: string
  logged_seconds: number
}

/**
 * Sums non-PTO logged hours by `dim_project.project_type` (D-011).
 * - internal: `internal`
 * - commercial: `build` + `support`
 */
export function sumLoggedHoursByProjectType(
  worklogs: WorklogSlice[],
  projectTypeById: Map<string, string>
): LoggedHoursByProjectType {
  let internal = 0
  let commercial = 0
  for (const row of worklogs) {
    const hours = Number(row.logged_seconds) / 3600
    const type = projectTypeById.get(row.project_id)
    if (type === 'internal') {
      internal += hours
    } else if (type === 'build' || type === 'support') {
      commercial += hours
    }
  }
  return {
    internalLoggedHoursMtd: roundDisplayStat(internal),
    commercialLoggedHoursMtd: roundDisplayStat(commercial),
  }
}

export async function loadProjectTypeById(
  supabase: SupabaseClient<Database>,
  projectIds: string[]
): Promise<{ data: Map<string, string>; error: string | null }> {
  const map = new Map<string, string>()
  if (projectIds.length === 0) {
    return { data: map, error: null }
  }

  const unique = [...new Set(projectIds)]
  for (let i = 0; i < unique.length; i += PROJECT_ID_BATCH) {
    const slice = unique.slice(i, i + PROJECT_ID_BATCH)
    const { data, error } = await supabase
      .from('dim_project')
      .select('id, project_type')
      .in('id', slice)

    if (error) {
      return { data: map, error: error.message }
    }
    for (const row of data ?? []) {
      if (row.project_type) {
        map.set(row.id, row.project_type)
      }
    }
  }

  return { data: map, error: null }
}
