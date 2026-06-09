import { eachDayOfInterval, format, parse, startOfWeek, subWeeks } from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import {
  countPeopleOnProjectPlan,
  projectBudgetUsedPct,
} from '@/lib/domain/project-delivery-metrics'
import {
  aggregateLoggedHoursByDate,
  buildPerMonthExecutionPoints,
} from '@/lib/projects/overview/build-project-execution-series'
import {
  formatMonthKeyLabel,
  loadProjectActualsForMonths,
  loadProjectActualsForMonthsFromOptions,
  loadProjectGrainPlans,
  loadLifetimePlannedHoursByProject,
  loadProjectGrainPlansForMonths,
  monthStartsFromProjectStart,
  sumPlannedHoursByProject,
  type ProjectPlanGrainRow,
} from '@/lib/projects/overview/load-project-grain-data'
import { loadProjectsGlobalTotalsCached } from '@/lib/projects/overview/load-projects-global-list'
import type { ProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'
import type { ProjectDetailPanelPayload, ProjectRoleHoursRow } from '@/lib/projects/overview/projects-types'
import { createServiceClientCached } from '@/lib/supabase/server'
import { isProjectSpaceType } from '@/lib/domain/project-types'
import {
  PM_ROLE_KEY,
  resolvePmForMembers,
  resolveTlNamesForMembers,
  roleSortIndex,
  type TeamsCompositionMember,
} from '@/lib/teams/composition/teams-composition-utils'
const BATCH = 200

async function resolveBuildExecutionStartDate(
  supabase: ReturnType<typeof createServiceClientCached>,
  projectId: string,
  startDate: string | null,
  fallbackMonthStartStr: string
): Promise<string> {
  if (startDate) return startDate

  const { data, error } = await supabase
    .from('fact_worklogs')
    .select('log_date')
    .eq('project_id', projectId)
    .eq('is_pto', false)
    .order('log_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!error && data?.log_date) {
    return data.log_date as string
  }

  return fallbackMonthStartStr
}

function buildRoleHoursRows(
  hoursByRole: Map<string, { roleKey: string; roleLabel: string; hours: number }>
): ProjectRoleHoursRow[] {
  const total = Array.from(hoursByRole.values()).reduce((s, r) => s + r.hours, 0)
  const rows: ProjectRoleHoursRow[] = []

  for (const entry of hoursByRole.values()) {
    const hours = roundDisplayStat(entry.hours)
    rows.push({
      roleKey: entry.roleKey,
      roleLabel: entry.roleLabel,
      hours,
      sharePct: total > 0 ? roundDisplayStat((hours / total) * 100) : 0,
    })
  }

  rows.sort((a, b) => {
    const orderCmp = roleSortIndex(a.roleKey) - roleSortIndex(b.roleKey)
    if (orderCmp !== 0) return orderCmp
    return a.roleLabel.localeCompare(b.roleLabel, 'en')
  })

  return rows
}

export async function loadProjectDetailPanel(params: {
  projectKey: string
  viewMode: 'monthly' | 'global'
  monthContext: ProjectsMonthContext
}): Promise<{ data: ProjectDetailPanelPayload | null; error: string | null }> {
  const { monthContext } = params
  const { monthStartStr, monthLabel, monthEndStr, snapshot, options } = monthContext

  const supabase = createServiceClientCached()

  const { data: projectRow, error: projectErr } = await supabase
    .from('dim_project')
    .select(
      'id, project_key, project_name, project_type, start_date, budget_hours, status, target_release_date, projected_hours_at_completion'
    )
    .eq('project_key', params.projectKey)
    .maybeSingle()

  if (projectErr) return { data: null, error: projectErr.message }
  if (!projectRow) return { data: null, error: null }
  if (!isProjectSpaceType(projectRow.project_type)) {
    return { data: null, error: 'Unsupported project type' }
  }

  const projectId = projectRow.id as string

  const isBuildProject = projectRow.project_type === 'build'
  const executionScope = isBuildProject ? 'lifetime' : 'month'
  const executionGranularity = isBuildProject ? 'month' : 'day'

  const buildExecutionStartStr = isBuildProject
    ? await resolveBuildExecutionStartDate(
        supabase,
        projectId,
        projectRow.start_date,
        monthStartStr
      )
    : monthStartStr

  const executionMonthKeys = isBuildProject
    ? monthStartsFromProjectStart(buildExecutionStartStr, monthStartStr)
    : []

  const velocityStart = format(subWeeks(new Date(), 6), 'yyyy-MM-dd')

  const [
    monthActualsRes,
    executionActualsRes,
    executionPlansRes,
    monthPlansRes,
    worklogRes,
    velocityRes,
    roleMetaRes,
  ] = await Promise.all([
    loadProjectActualsForMonths(snapshot.id, [monthStartStr]),
    isBuildProject
      ? loadProjectActualsForMonthsFromOptions(executionMonthKeys, options)
      : Promise.resolve({ rows: [], error: null as string | null }),
    isBuildProject
      ? loadProjectGrainPlansForMonths(executionMonthKeys, options)
      : Promise.resolve({
          rowsByMonth: new Map<string, ProjectPlanGrainRow[]>(),
          error: null as string | null,
        }),
    loadProjectGrainPlans(snapshot.id, monthStartStr),
    pagedQuery<{
      person_id: string
      log_date: string
      logged_seconds: number
    }>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, log_date, logged_seconds')
        .eq('project_id', projectId)
        .eq('is_pto', false)
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .order('log_date')
        .range(from, from + 999)
    ),
    pagedQuery<{ log_date: string; logged_seconds: number }>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('log_date, logged_seconds')
        .eq('project_id', projectId)
        .eq('is_pto', false)
        .gte('log_date', velocityStart)
        .lte('log_date', monthEndStr)
        .order('log_date')
        .range(from, from + 999)
    ),
    supabase.from('dim_role').select('id, key, label'),
  ])

  if (monthActualsRes.error) {
    return { data: null, error: monthActualsRes.error }
  }
  if (isBuildProject && executionActualsRes.error) {
    return { data: null, error: executionActualsRes.error }
  }
  if (isBuildProject && executionPlansRes.error) {
    return { data: null, error: executionPlansRes.error }
  }
  if (monthPlansRes.error) return { data: null, error: monthPlansRes.error }
  if (worklogRes.error) return { data: null, error: worklogRes.error }
  if (velocityRes.error) return { data: null, error: velocityRes.error }
  if (roleMetaRes.error) return { data: null, error: roleMetaRes.error.message }

  const roleById = new Map<string, { key: string; label: string }>()
  let pmRoleId: string | null = null
  for (const role of roleMetaRes.data ?? []) {
    roleById.set(role.id, { key: role.key, label: role.label })
    if (role.key === PM_ROLE_KEY) pmRoleId = role.id
  }

  const monthlyPlannedHours = roundDisplayStat(
    sumPlannedHoursByProject(monthPlansRes.rows).get(projectId) ?? 0
  )

  let executionSeries: ProjectDetailPanelPayload['executionSeries']

  if (isBuildProject) {
    const plannedByExecutionMonth = new Map<string, number>()
    for (const key of executionMonthKeys) {
      const planRows = executionPlansRes.rowsByMonth.get(key) ?? []
      const sums = sumPlannedHoursByProject(planRows)
      plannedByExecutionMonth.set(key, roundDisplayStat(sums.get(projectId) ?? 0))
    }

    const loggedByExecutionMonth = new Map<string, number>()
    for (const row of executionActualsRes.rows) {
      if (row.project_id !== projectId) continue
      loggedByExecutionMonth.set(
        row.month_date,
        roundDisplayStat((loggedByExecutionMonth.get(row.month_date) ?? 0) + row.logged_hours)
      )
    }

    executionSeries = buildPerMonthExecutionPoints(
      executionMonthKeys,
      plannedByExecutionMonth,
      loggedByExecutionMonth,
      formatMonthKeyLabel
    )
  } else {
    const loggedByDate = aggregateLoggedHoursByDate(worklogRes.rows)
    const monthStart = parse(monthStartStr, 'yyyy-MM-dd', new Date())
    const monthEnd = parse(monthEndStr, 'yyyy-MM-dd', new Date())
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const dayCount = Math.max(1, days.length)
    const dailyPlanned = monthlyPlannedHours / dayCount

    executionSeries = days.map((day) => {
      const periodKey = format(day, 'yyyy-MM-dd')
      return {
        periodKey,
        periodLabel: format(day, 'd'),
        plannedHours: roundDisplayStat(dailyPlanned),
        loggedHours: roundDisplayStat(loggedByDate.get(periodKey) ?? 0),
      }
    })
  }

  let plannedHoursTotal = roundDisplayStat(
    sumPlannedHoursByProject(monthPlansRes.rows).get(projectId) ?? 0
  )
  const monthActualsForProject = monthActualsRes.rows.filter(
    (r) => r.project_id === projectId && r.month_date === monthStartStr
  )
  let loggedHoursTotal = roundDisplayStat(
    monthActualsForProject.reduce((s, r) => s + r.logged_hours, 0)
  )
  let billableHoursTotal = roundDisplayStat(
    monthActualsForProject.reduce((s, r) => s + r.billable_hours, 0)
  )

  if (params.viewMode === 'global') {
    const globalRes = await loadProjectsGlobalTotalsCached()
    if (globalRes.error) return { data: null, error: globalRes.error }
    const globalRow = globalRes.rows.find((r) => r.project_id === projectId)
    if (globalRow) {
      loggedHoursTotal = roundDisplayStat(Number(globalRow.lifetime_logged_hours))
      billableHoursTotal = roundDisplayStat(Number(globalRow.lifetime_billable_hours))
    }
    if (isBuildProject) {
      plannedHoursTotal = roundDisplayStat(
        executionSeries.reduce((s, point) => s + point.plannedHours, 0)
      )
    } else {
      const lifetimePlannedRes = await loadLifetimePlannedHoursByProject({
        anchorMonthStartStr: monthStartStr,
        options,
        projects: [{ id: projectId, start_date: projectRow.start_date }],
      })
      if (lifetimePlannedRes.error) {
        return { data: null, error: lifetimePlannedRes.error }
      }
      plannedHoursTotal = lifetimePlannedRes.byProject.get(projectId) ?? plannedHoursTotal
    }
  }

  const teamSize = countPeopleOnProjectPlan(monthPlansRes.rows, projectId)
  const monthKey = monthStartStr.slice(0, 7)

  const personIds = Array.from(new Set(monthPlansRes.rows.map((r) => r.person_id)))
  const namesById = new Map<string, string>()
  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)
    if (error) return { data: null, error: error.message }
    for (const row of data ?? []) {
      namesById.set(row.id, row.name)
    }
  }

  const members: TeamsCompositionMember[] = []
  for (const row of monthPlansRes.rows) {
    if (row.project_id !== projectId || row.planned_hours <= 0) continue
    const role = row.role_id ? roleById.get(row.role_id) : null
    members.push({
      personId: row.person_id,
      personName: namesById.get(row.person_id) ?? row.person_id,
      roleKey: role?.key ?? 'unknown',
      roleLabel: role?.label ?? 'Unknown',
      isPm: row.role_id != null && row.role_id === pmRoleId,
    })
  }

  const { pmName } = resolvePmForMembers(members)
  const tlNames = resolveTlNamesForMembers(members)

  const roleAllocationMap = new Map<string, { roleKey: string; roleLabel: string; hours: number }>()
  for (const row of monthPlansRes.rows) {
    if (row.project_id !== projectId || row.planned_hours <= 0) continue
    const role = row.role_id ? roleById.get(row.role_id) : null
    const roleKey = role?.key ?? 'unknown'
    const existing = roleAllocationMap.get(roleKey)
    if (existing) {
      existing.hours += row.planned_hours
    } else {
      roleAllocationMap.set(roleKey, {
        roleKey,
        roleLabel: role?.label ?? 'Unknown',
        hours: row.planned_hours,
      })
    }
  }

  const personIdsLogged = Array.from(new Set(worklogRes.rows.map((r) => r.person_id)))
  const personRoleById = new Map<string, string | null>()
  if (personIdsLogged.length > 0) {
    for (let i = 0; i < personIdsLogged.length; i += BATCH) {
      const slice = personIdsLogged.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from('dim_person')
        .select('id, role_id')
        .in('id', slice)
      if (error) return { data: null, error: error.message }
      for (const row of data ?? []) {
        personRoleById.set(row.id, row.role_id)
      }
    }
  }

  const teamBreakdownMap = new Map<string, { roleKey: string; roleLabel: string; hours: number }>()
  for (const row of worklogRes.rows) {
    const hours = Number(row.logged_seconds) / 3600
    const roleId = personRoleById.get(row.person_id)
    const role = roleId ? roleById.get(roleId) : null
    const roleKey = role?.key ?? 'unknown'
    const existing = teamBreakdownMap.get(roleKey)
    if (existing) {
      existing.hours += hours
    } else {
      teamBreakdownMap.set(roleKey, {
        roleKey,
        roleLabel: role?.label ?? 'Unknown',
        hours,
      })
    }
  }

  const velocityByWeek = new Map<string, number>()
  for (const row of velocityRes.rows) {
    const weekKey = format(startOfWeek(parse(row.log_date, 'yyyy-MM-dd', new Date()), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    velocityByWeek.set(
      weekKey,
      (velocityByWeek.get(weekKey) ?? 0) + Number(row.logged_seconds) / 3600
    )
  }

  const velocityWeeks = Array.from(velocityByWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([weekKey, hours]) => ({
      weekLabel: format(parse(weekKey, 'yyyy-MM-dd', new Date()), "'W'II"),
      loggedHours: roundDisplayStat(hours),
    }))

  return {
    data: {
      projectId,
      projectKey: projectRow.project_key,
      projectName: projectRow.project_name,
      projectType: projectRow.project_type,
      startDate: projectRow.start_date,
      targetReleaseDate: projectRow.target_release_date,
      budgetHours: projectRow.budget_hours,
      projectedHoursAtCompletion:
        projectRow.projected_hours_at_completion != null
          ? roundDisplayStat(projectRow.projected_hours_at_completion)
          : null,
      pmName,
      tlNames,
      plannedHoursTotal,
      loggedHoursTotal,
      billableHoursTotal,
      budgetUsedPct: projectBudgetUsedPct(
        loggedHoursTotal,
        projectRow.budget_hours
      ),
      teamSize,
      monthKey,
      executionSeries,
      executionScope,
      executionGranularity,
      teamBreakdown: buildRoleHoursRows(teamBreakdownMap),
      roleAllocation: buildRoleHoursRows(roleAllocationMap),
      velocityWeeks,
      viewMode: params.viewMode,
      monthLabel,
    },
    error: null,
  }
}
