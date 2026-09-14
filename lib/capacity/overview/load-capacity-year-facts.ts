import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_MONTH_OPS } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { isCommercialProjectType } from '@/lib/domain/project-types'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

export type CapacityYearOpsRow = {
  person_id: string
  month_date: string
  role_id: string | null
  net_capacity_hours: number
  logged_hours: number
  commercial_logged_hours: number
  non_commercial_logged_hours: number
  pto_hours: number
  elapsed_net_weekdays: number
}

export type CapacityYearRoleRow = {
  id: string
  key: string
  label: string
}

export type CapacityYearProjectRow = {
  project_id: string
  month_date: string
  project_type: string | null
  is_commercial: boolean
}

export type CapacityYearFacts = {
  ops: CapacityYearOpsRow[]
  roles: CapacityYearRoleRow[]
  projects: CapacityYearProjectRow[]
}

export async function loadCapacityYearFacts(): Promise<{
  data: CapacityYearFacts | null
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_OPS)

  const supabase = createServiceClientCached()
  const [opsResult, rolesResult, projectRows, projectDims] = await Promise.all([
    pagedQuery<CapacityYearOpsRow>(async (from) =>
      supabase
        .from('fact_month_ops')
        .select(
          'person_id, month_date, role_id, net_capacity_hours, logged_hours, commercial_logged_hours, non_commercial_logged_hours, pto_hours, elapsed_net_weekdays'
        )
        .order('month_date')
        .order('person_id')
        .range(from, from + PAGE - 1)
    ),
    supabase.from('dim_role').select('id, key, label').order('key'),
    pagedQuery<{ project_id: string; month_date: string }>(async (from) =>
      supabase
        .from('fact_month_projects')
        .select('project_id, month_date')
        .order('month_date')
        .order('project_id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<{ id: string; project_type: string | null; is_commercial: boolean | null }>(
      async (from) =>
        supabase
          .from('dim_project')
          .select('id, project_type, is_commercial')
          .order('id')
          .range(from, from + PAGE - 1)
    ),
  ])

  if (opsResult.error) return { data: null, error: opsResult.error }
  if (rolesResult.error) return { data: null, error: rolesResult.error.message }
  if (projectRows.error) return { data: null, error: projectRows.error }
  if (projectDims.error) return { data: null, error: projectDims.error }

  const dimByProject = new Map(
    projectDims.rows.map((row) => [row.id, row])
  )

  return {
    data: {
      ops: opsResult.rows,
      roles: rolesResult.data ?? [],
      projects: projectRows.rows.map((row) => {
        const dim = dimByProject.get(row.project_id)
        return {
          project_id: row.project_id,
          month_date: row.month_date,
          project_type: dim?.project_type ?? null,
          is_commercial:
            dim?.is_commercial ?? isCommercialProjectType(dim?.project_type ?? null),
        }
      }),
    },
    error: null,
  }
}
