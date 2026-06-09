import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'
import {
  isProjectSpaceType,
  type ProjectSpaceType,
} from '@/lib/domain/project-types'

export type ActiveProjectMeta = {
  id: string
  project_key: string
  project_name: string | null
  project_type: ProjectSpaceType
  status: string
  start_date: string | null
  budget_hours: number | null
}

type ProjectRow = {
  id: string
  project_key: string
  project_name: string | null
  project_type: string
  status: string
  start_date: string | null
  budget_hours: number | null
}

export async function loadActiveProjects(): Promise<{
  rows: ActiveProjectMeta[]
  error: string | null
}> {
  const supabase = createServiceClientCached()

  const { rows, error } = await pagedQuery<ProjectRow>(async (from) =>
    supabase
      .from('dim_project')
      .select(
        'id, project_key, project_name, project_type, status, start_date, budget_hours'
      )
      .eq('status', 'active')
      .order('project_key')
      .range(from, from + 999)
  )

  if (error) {
    return { rows: [], error }
  }

  const mapped: ActiveProjectMeta[] = []
  for (const row of rows) {
    if (!isProjectSpaceType(row.project_type)) continue
    mapped.push({
      id: row.id,
      project_key: row.project_key,
      project_name: row.project_name,
      project_type: row.project_type,
      status: row.status,
      start_date: row.start_date,
      budget_hours: row.budget_hours,
    })
  }

  return { rows: mapped, error: null }
}
