import type { SupabaseClient } from '@supabase/supabase-js'
import { endOfMonth, format, parse } from 'date-fns'

import type { CompositionSuggestOption } from '@/lib/teams/composition/composition-suggest-utils'
import {
  isProjectSpaceType,
  projectSpaceTypeLabel,
} from '@/lib/domain/project-types'
import { projectCardTitle } from '@/lib/teams/composition/teams-composition-utils'
import { createServiceClientCached } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

const PAGE = 1000
const BATCH = 200

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

export type CompositionFilterSuggestions = {
  people: CompositionSuggestOption[]
  projects: CompositionSuggestOption[]
}

export async function loadCompositionFilterSuggestions(params: {
  monthStartStr: string
  snapshotId: string
}): Promise<{ data: CompositionFilterSuggestions | null; error: string | null }> {
  const { monthStartStr, snapshotId } = params
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')

  try {
    const supabase = createServiceClientCached()

    const [planResult, worklogResult] = await Promise.all([
      pagedQuery<{ person_id: string; project_id: string }>(async (from) =>
        supabase
          .from('fact_plans')
          .select('person_id, project_id')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .eq('is_pto', false)
          .not('project_id', 'is', null)
          .gt('planned_hours', 0)
          .order('project_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ project_id: string }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('project_id')
          .gte('log_date', monthStartStr)
          .lte('log_date', monthEndStr)
          .eq('is_pto', false)
          .order('project_id')
          .range(from, from + PAGE - 1)
      ),
    ])

    if (planResult.error) return { data: null, error: `fact_plans: ${planResult.error}` }
    if (worklogResult.error) return { data: null, error: `fact_worklogs: ${worklogResult.error}` }

    const personIds = new Set<string>()
    const projectIds = new Set<string>()

    for (const row of planResult.rows) {
      personIds.add(row.person_id)
      projectIds.add(row.project_id)
    }
    for (const row of worklogResult.rows) {
      if (row.project_id) projectIds.add(row.project_id)
    }

    if (personIds.size === 0 && projectIds.size === 0) {
      return { data: { people: [], projects: [] }, error: null }
    }

    const [peopleResult, projectsResult] = await Promise.all([
      loadPeopleSuggestions(supabase, Array.from(personIds)),
      loadProjectSuggestions(supabase, Array.from(projectIds)),
    ])

    if (peopleResult.error) return { data: null, error: peopleResult.error }
    if (projectsResult.error) return { data: null, error: projectsResult.error }

    return {
      data: {
        people: peopleResult.options,
        projects: projectsResult.options,
      },
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load composition filter suggestions.'
    return { data: null, error: message }
  }
}

async function loadPeopleSuggestions(
  supabase: SupabaseClient<Database>,
  personIds: readonly string[]
): Promise<{ options: CompositionSuggestOption[]; error: string | null }> {
  const names = new Map<string, string>()

  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)
    if (error) return { options: [], error: error.message }
    for (const row of data ?? []) {
      names.set(row.id, row.name)
    }
  }

  const options = Array.from(names.values())
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((name) => ({ value: name, label: name }))

  return { options, error: null }
}

async function loadProjectSuggestions(
  supabase: SupabaseClient<Database>,
  projectIds: readonly string[]
): Promise<{ options: CompositionSuggestOption[]; error: string | null }> {
  const rows: {
    project_key: string
    project_name: string | null
    project_type: string
  }[] = []

  for (let i = 0; i < projectIds.length; i += BATCH) {
    const slice = projectIds.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('dim_project')
      .select('project_key, project_name, project_type')
      .in('id', slice)

    if (error) return { options: [], error: error.message }

    for (const row of data ?? []) {
      if (isProjectSpaceType(row.project_type)) {
        rows.push(row)
      }
    }
  }

  const options = rows
    .sort((a, b) => a.project_key.localeCompare(b.project_key, 'en'))
    .map((row) => {
      const label = projectCardTitle({
        projectKey: row.project_key,
        projectName: row.project_name,
      })
      return {
        value: label,
        label,
        hint: projectSpaceTypeLabel(row.project_type),
      }
    })

  return { options, error: null }
}
