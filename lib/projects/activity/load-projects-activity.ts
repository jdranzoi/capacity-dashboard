import { cacheLife, cacheTag } from 'next/cache'
import { endOfMonth, format, parse } from 'date-fns'

import {
  ACTIVITY_PROJECT_TYPE_ORDER,
  activityProjectTypeKey,
  activityProjectTypeLabel,
  isProjectSpaceType,
  type ActivityProjectType,
  type ActivityProjectTypeFilter,
} from '@/lib/domain/project-types'
import { CACHE_TAG_MONTH_OPS } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import type { ProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'
import type {
  ProjectsActivityGroup,
  ProjectsActivityPageData,
  ProjectsActivityPayload,
  ProjectsActivityRow,
} from '@/lib/projects/activity/activity-types'
import type { ProjectsActivityRouteFilters } from '@/lib/projects/activity/activity-route-filters'

const PAGE = 1000

type ProjectDimRow = {
  id: string
  project_key: string
  project_name: string | null
  project_type: string
  status: string
  start_date: string | null
  end_date: string | null
}

type FactMonthProjectRow = {
  project_id: string
  logged_hours: number
  dim_project: ProjectDimRow | ProjectDimRow[] | null
}

export async function getActivityMonthContext(
  monthKey: string | undefined
): Promise<{ data: ProjectsMonthContext | null; error: string | null }> {
  const { options, error } = await loadOverviewMonthOptions()
  if (error) return { data: null, error }

  const selected = resolveSelectedOverviewMonth(options, monthKey)
  if (!selected) return { data: null, error: null }

  const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
  return {
    data: {
      options,
      selected,
      snapshot: { id: selected.snapshotId, createdAt: selected.syncCreatedAt },
      monthStartStr: selected.monthStartStr,
      monthEndStr: format(endOfMonth(referenceDate), 'yyyy-MM-dd'),
      monthLabel: selected.label,
    },
    error: null,
  }
}

async function loadActivityRows(
  monthStartStr: string
): Promise<{ rows: ProjectsActivityRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_OPS)

  const supabase = createServiceClientCached()
  const facts = await pagedQuery<FactMonthProjectRow>(async (from) =>
    supabase
      .from('fact_month_projects')
      .select(
        'project_id, logged_hours, dim_project(id, project_key, project_name, project_type, status, start_date, end_date)'
      )
      .eq('month_date', monthStartStr)
      .order('project_id')
      .range(from, from + PAGE - 1)
  )
  if (facts.error) return { rows: [], error: facts.error }

  const rows: ProjectsActivityRow[] = []
  for (const fact of facts.rows) {
    const embedded = fact.dim_project
    const project = Array.isArray(embedded) ? (embedded[0] ?? null) : embedded
    if (!project || project.id !== fact.project_id) continue
    const type = activityProjectTypeKey(project.project_type)
    rows.push({
      projectId: project.id,
      projectKey: project.project_key,
      projectName: project.project_name,
      projectType: type,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      loggedHours: roundDisplayStat(Number(fact.logged_hours) || 0),
      hasDeliveryDetail: isProjectSpaceType(type),
    })
  }

  rows.sort((a, b) => {
    if (b.loggedHours !== a.loggedHours) return b.loggedHours - a.loggedHours
    return a.projectKey.localeCompare(b.projectKey, 'en')
  })

  return { rows, error: null }
}

function buildGroups(
  rows: ProjectsActivityRow[],
  typeFilter: ActivityProjectTypeFilter
): { groups: ProjectsActivityGroup[]; typeOptions: ActivityProjectTypeFilter[] } {
  const byType = new Map<ActivityProjectType, ProjectsActivityRow[]>()
  for (const row of rows) {
    const list = byType.get(row.projectType)
    if (list) list.push(row)
    else byType.set(row.projectType, [row])
  }

  const present = ACTIVITY_PROJECT_TYPE_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0)
  const typeOptions: ActivityProjectTypeFilter[] = ['all', ...present]
  const visibleTypes =
    typeFilter === 'all'
      ? present
      : present.includes(typeFilter)
        ? [typeFilter]
        : [typeFilter]

  const groups = visibleTypes.map((type) => ({
    type,
    label: activityProjectTypeLabel(type),
    rows: byType.get(type) ?? [],
  }))

  return { groups, typeOptions }
}

export async function loadProjectsActivityPage(
  filters: ProjectsActivityRouteFilters
): Promise<{ data: ProjectsActivityPageData | null; error: string | null }> {
  const monthCtx = await getActivityMonthContext(filters.monthKey ?? undefined)
  if (monthCtx.error) return { data: null, error: monthCtx.error }
  if (!monthCtx.data) return { data: null, error: null }

  const rowsRes = await loadActivityRows(monthCtx.data.monthStartStr)
  if (rowsRes.error) return { data: null, error: rowsRes.error }

  const { groups, typeOptions } = buildGroups(rowsRes.rows, filters.type)
  const visibleRows = groups.flatMap((group) => group.rows)

  const payload: ProjectsActivityPayload = {
    monthKey: monthCtx.data.selected.monthKey,
    monthLabel: monthCtx.data.monthLabel,
    typeFilter: filters.type,
    totalCount: visibleRows.length,
    totalLoggedHours: visibleRows.reduce((sum, row) => sum + row.loggedHours, 0),
    groups,
    typeOptions: typeOptions.includes(filters.type) ? typeOptions : [...typeOptions, filters.type],
  }

  return {
    data: {
      payload,
      monthOptions: monthCtx.data.options,
    },
    error: null,
  }
}
