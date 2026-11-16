import { endOfMonth, format, parse } from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { aggregateProjectTeamHours } from '@/lib/projects/overview/aggregate-project-detail-team'
import {
  loadBuildDeliveryMonthOptions,
  resolveBuildExecutionStartDate,
  resolveBuildExecutionWindow,
} from '@/lib/projects/overview/build-project-delivery-window'
import { loadProjectPersonPlans } from '@/lib/projects/overview/load-project-grain-data'
import type {
  ProjectDetailTeamPayload,
  ProjectExecutionScope,
} from '@/lib/projects/overview/projects-types'
import { createServiceClientCached } from '@/lib/supabase/server'

const BATCH = 200

type TeamPlanRow = {
  person_id: string
  role_id: string | null
  planned_hours: number
}

type TeamWorklogRow = {
  person_id: string
  logged_seconds: number
}

export function isProjectDetailTeamScope(value: string): value is ProjectExecutionScope {
  return value === 'lifetime' || value === 'month'
}

export async function loadProjectDetailTeam(params: {
  projectKey: string
  monthKey: string | null
  scope: ProjectExecutionScope
}): Promise<{ data: ProjectDetailTeamPayload | null; error: string | null }> {
  const supabase = createServiceClientCached()

  const { data: projectRow, error: projectErr } = await supabase
    .from('dim_project')
    .select('id, project_key, start_date, end_date')
    .eq('project_key', params.projectKey)
    .maybeSingle()

  if (projectErr) return { data: null, error: projectErr.message }
  if (!projectRow) return { data: null, error: null }

  const monthOptionsRes = await loadOverviewMonthOptions()
  if (monthOptionsRes.error) return { data: null, error: monthOptionsRes.error }

  const selected = resolveSelectedOverviewMonth(
    monthOptionsRes.options,
    params.monthKey ?? undefined
  )
  if (!selected) return { data: null, error: null }

  const monthStartStr = selected.monthStartStr
  const monthEndStr = format(endOfMonth(parse(monthStartStr, 'yyyy-MM-dd', new Date())), 'yyyy-MM-dd')
  const monthLabel = selected.label
  const snapshotId = selected.snapshotId
  const options = monthOptionsRes.options
  const projectId = projectRow.id as string
  const scope = params.scope

  const [roleMetaRes, planWorklog] = await Promise.all([
    supabase.from('dim_role').select('id, key, label'),
    scope === 'lifetime'
      ? loadLifetimeTeamHours({
          projectId,
          startDate: projectRow.start_date,
          endDate: projectRow.end_date,
          monthStartStr,
          options,
          snapshotId,
        })
      : loadMonthTeamHours({
          projectId,
          snapshotId,
          monthStartStr,
          monthEndStr,
        }),
  ])

  if (roleMetaRes.error) return { data: null, error: roleMetaRes.error.message }
  if (planWorklog.error) return { data: null, error: planWorklog.error }

  const roleById = new Map<string, { key: string; label: string }>()
  for (const role of roleMetaRes.data ?? []) {
    roleById.set(role.id, { key: role.key, label: role.label })
  }

  const personIds = Array.from(
    new Set([
      ...planWorklog.planRows.map((r) => r.person_id),
      ...planWorklog.worklogRows.map((r) => r.person_id),
    ])
  )

  const namesById = new Map<string, string>()
  const personRoleIdById = new Map<string, string | null>()
  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('dim_person')
      .select('id, name, role_id')
      .in('id', slice)
    if (error) return { data: null, error: error.message }
    for (const row of data ?? []) {
      namesById.set(row.id, row.name)
      personRoleIdById.set(row.id, row.role_id)
    }
  }

  return {
    data: {
      scope,
      monthLabel: scope === 'month' ? monthLabel : null,
      roles: aggregateProjectTeamHours({
        planRows: planWorklog.planRows,
        worklogRows: planWorklog.worklogRows,
        namesById,
        personRoleIdById,
        roleById,
      }),
    },
    error: null,
  }
}

async function loadMonthTeamHours(params: {
  projectId: string
  snapshotId: string
  monthStartStr: string
  monthEndStr: string
}): Promise<{
  planRows: TeamPlanRow[]
  worklogRows: TeamWorklogRow[]
  error: string | null
}> {
  const supabase = createServiceClientCached()
  const [plansRes, worklogRes] = await Promise.all([
    loadProjectPersonPlans(params.snapshotId, params.monthStartStr, params.projectId),
    pagedQuery<TeamWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, logged_seconds')
        .eq('project_id', params.projectId)
        .eq('is_pto', false)
        .gte('log_date', params.monthStartStr)
        .lte('log_date', params.monthEndStr)
        .order('person_id')
        .range(from, from + 999)
    ),
  ])

  if (plansRes.error) {
    return { planRows: [], worklogRows: [], error: plansRes.error }
  }
  if (worklogRes.error) {
    return { planRows: [], worklogRows: [], error: worklogRes.error }
  }

  return {
    planRows: plansRes.rows,
    worklogRows: worklogRes.rows,
    error: null,
  }
}

async function loadLifetimeTeamHours(params: {
  projectId: string
  startDate: string | null
  endDate: string | null
  monthStartStr: string
  options: readonly OverviewMonthOption[]
  snapshotId: string
}): Promise<{
  planRows: TeamPlanRow[]
  worklogRows: TeamWorklogRow[]
  error: string | null
}> {
  const supabase = createServiceClientCached()
  const periodStart = await resolveBuildExecutionStartDate(
    supabase,
    params.projectId,
    params.startDate,
    params.monthStartStr
  )
  const window = resolveBuildExecutionWindow({
    periodStart,
    periodEnd: params.endDate,
    fallbackMonthStartStr: params.monthStartStr,
  })
  const worklogEndStr = params.endDate ?? format(new Date(), 'yyyy-MM-dd')

  const [monthOptionsRes, worklogRes] = await Promise.all([
    loadBuildDeliveryMonthOptions(params.options),
    pagedQuery<TeamWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, logged_seconds')
        .eq('project_id', params.projectId)
        .eq('is_pto', false)
        .gte('log_date', periodStart)
        .lte('log_date', worklogEndStr)
        .order('person_id')
        .range(from, from + 999)
    ),
  ])

  if (monthOptionsRes.error) {
    return { planRows: [], worklogRows: [], error: monthOptionsRes.error }
  }
  if (worklogRes.error) {
    return { planRows: [], worklogRows: [], error: worklogRes.error }
  }

  const snapshotByMonth = new Map(
    monthOptionsRes.options.map((option) => [option.monthStartStr, option.snapshotId] as const)
  )

  const planBatches = await Promise.all(
    window.monthKeys.map((monthKey) => {
      const snapshotId = snapshotByMonth.get(monthKey) ?? params.snapshotId
      return loadProjectPersonPlans(snapshotId, monthKey, params.projectId)
    })
  )
  const planError = planBatches.find((batch) => batch.error)?.error ?? null
  if (planError) {
    return { planRows: [], worklogRows: [], error: planError }
  }

  return {
    planRows: planBatches.flatMap((batch) => batch.rows),
    worklogRows: worklogRes.rows,
    error: null,
  }
}
