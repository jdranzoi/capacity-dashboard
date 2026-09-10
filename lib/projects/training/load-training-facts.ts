import { cacheLife, cacheTag } from 'next/cache'

import { pagedQuery } from '@/lib/data/paged-query'
import { CACHE_TAG_TRAINING } from '@/lib/data/cache-tags'
import { TRAINING_PROJECT_KEY } from '@/lib/projects/training/training-constants'
import { createServiceClientCached } from '@/lib/supabase/server'

export type TrainingIssueFact = {
  id: string
  issue_key: string
  summary: string
  status: string
  status_category: string | null
  is_child: boolean
  assignee_person_id: string | null
  fix_versions: string[]
  components: string[]
  labels: string[]
  original_estimate_seconds: number | null
}

export type TrainingWorklogFact = {
  issue_id: string
  log_date: string
  logged_seconds: number
}

export type TrainingFacts = {
  issues: TrainingIssueFact[]
  worklogs: TrainingWorklogFact[]
  personNames: Array<{ id: string; name: string }>
}

export async function loadTrainingFacts(): Promise<{
  data: TrainingFacts | null
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

  if (projectRes.error) {
    return { data: null, error: projectRes.error.message }
  }
  if (!projectRes.data) {
    return {
      data: null,
      error: `Project ${TRAINING_PROJECT_KEY} is not in dim_project. Run sync-v2 first.`,
    }
  }

  const projectId = projectRes.data.id

  const issuesRes = await pagedQuery<TrainingIssueFact>(async (from) =>
    supabase
      .from('dim_issue')
      .select(
        'id, issue_key, summary, status, status_category, is_child, assignee_person_id, fix_versions, components, labels, original_estimate_seconds'
      )
      .eq('project_id', projectId)
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

  const issueIds = issuesRes.rows.map((issue) => issue.id)
  const worklogs: TrainingWorklogFact[] = []

  for (let i = 0; i < issueIds.length; i += 200) {
    const batch = issueIds.slice(i, i + 200)
    const worklogRes = await pagedQuery<TrainingWorklogFact>(async (from) =>
      supabase
        .from('fact_issue_worklogs')
        .select('issue_id, log_date, logged_seconds')
        .in('issue_id', batch)
        .range(from, from + 999)
    )
    if (worklogRes.error) {
      return { data: null, error: worklogRes.error }
    }
    worklogs.push(...worklogRes.rows)
  }

  const personIds = [
    ...new Set(
      issuesRes.rows
        .map((issue) => issue.assignee_person_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const personNames: Array<{ id: string; name: string }> = []
  if (personIds.length > 0) {
    const persons = await supabase.from('dim_person').select('id, name').in('id', personIds)
    if (persons.error) return { data: null, error: persons.error.message }
    for (const person of persons.data ?? []) {
      personNames.push({ id: person.id, name: person.name })
    }
  }

  return {
    data: {
      issues: issuesRes.rows,
      worklogs,
      personNames,
    },
    error: null,
  }
}
