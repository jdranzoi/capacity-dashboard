import { cacheLife, cacheTag } from 'next/cache'

import { pagedQuery } from '@/lib/data/paged-query'
import { CACHE_TAG_TRAINING } from '@/lib/data/cache-tags'
import { TRAINING_PROJECT_KEY } from '@/lib/projects/training/training-constants'
import { createServiceClientCached } from '@/lib/supabase/server'

export type TrainingYearIssueFact = {
  id: string
  is_child: boolean
  fix_versions: string[] | null
  components: string[] | null
}

export type TrainingYearWorklogFact = {
  issue_id: string
  person_id: string
  log_date: string
  logged_seconds: number
}

export type TrainingYearPersonFact = {
  id: string
  role_id: string | null
}

export type TrainingYearRoleFact = {
  id: string
  key: string
  label: string
}

export type TrainingYearFacts = {
  issues: TrainingYearIssueFact[]
  worklogs: TrainingYearWorklogFact[]
  persons: TrainingYearPersonFact[]
  roles: TrainingYearRoleFact[]
}

export async function loadTrainingYearFacts(): Promise<{
  data: TrainingYearFacts | null
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_TRAINING)

  const supabase = createServiceClientCached()

  const projectRes = await supabase
    .from('dim_project')
    .select('id')
    .eq('project_key', TRAINING_PROJECT_KEY)
    .maybeSingle()

  if (projectRes.error) return { data: null, error: projectRes.error.message }
  if (!projectRes.data) {
    return {
      data: null,
      error: `Project ${TRAINING_PROJECT_KEY} is not in dim_project. Run sync-v2 first.`,
    }
  }

  const projectId = projectRes.data.id

  const issuesRes = await pagedQuery<TrainingYearIssueFact>(async (from) =>
    supabase
      .from('dim_issue')
      .select('id, is_child, fix_versions, components')
      .eq('project_id', projectId)
      .eq('is_child', true)
      .range(from, from + 999)
  )
  if (issuesRes.error) {
    return {
      data: null,
      error: issuesRes.error.includes('dim_issue')
        ? 'Training tables are not applied yet. Run capacity-mcp migration 024 and npm run sync:training.'
        : issuesRes.error,
    }
  }

  const worklogs: TrainingYearWorklogFact[] = []
  const issueIds = issuesRes.rows.map((issue) => issue.id)
  for (let i = 0; i < issueIds.length; i += 200) {
    const batch = issueIds.slice(i, i + 200)
    const worklogRes = await pagedQuery<TrainingYearWorklogFact>(async (from) =>
      supabase
        .from('fact_issue_worklogs')
        .select('issue_id, person_id, log_date, logged_seconds')
        .in('issue_id', batch)
        .range(from, from + 999)
    )
    if (worklogRes.error) return { data: null, error: worklogRes.error }
    worklogs.push(...worklogRes.rows)
  }

  const personIds = [...new Set(worklogs.map((row) => row.person_id))]
  const persons: TrainingYearPersonFact[] = []
  if (personIds.length > 0) {
    const personRes = await supabase.from('dim_person').select('id, role_id').in('id', personIds)
    if (personRes.error) return { data: null, error: personRes.error.message }
    persons.push(...(personRes.data ?? []))
  }

  const roleRes = await supabase.from('dim_role').select('id, key, label')
  if (roleRes.error) return { data: null, error: roleRes.error.message }

  return {
    data: {
      issues: issuesRes.rows,
      worklogs,
      persons,
      roles: roleRes.data ?? [],
    },
    error: null,
  }
}
