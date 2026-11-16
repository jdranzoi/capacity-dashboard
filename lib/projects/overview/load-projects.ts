import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'

/** A `dim_project` row of any status; callers filter with `matchesProjectsStatus`. */
export type ProjectMeta = {
  id: string
  project_key: string
  project_name: string | null
  project_type: string
  status: string
  start_date: string | null
  end_date: string | null
  budget_hours: number | null
}

export async function loadProjects(): Promise<{
  rows: ProjectMeta[]
  error: string | null
}> {
  const supabase = createServiceClientCached()

  const { rows, error } = await pagedQuery<ProjectMeta>(async (from) =>
    supabase
      .from('dim_project')
      .select(
        'id, project_key, project_name, project_type, status, start_date, end_date, budget_hours'
      )
      .order('project_key')
      .range(from, from + 999)
  )

  if (error) {
    return { rows: [], error }
  }
  return { rows, error: null }
}
