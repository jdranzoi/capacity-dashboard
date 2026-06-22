import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import {
  buildPerMonthExecutionPoints,
} from '@/lib/projects/overview/build-project-execution-series'
import {
  formatMonthKeyLabel,
  loadProjectActualsForMonthsFromOptions,
  loadProjectGrainPlansForMonths,
  monthStartsFromProjectStart,
  sumPlannedHoursByProject,
  type ProjectActualsRow,
  type ProjectPlanGrainRow,
} from '@/lib/projects/overview/load-project-grain-data'
import type { ProjectExecutionPoint } from '@/lib/projects/overview/projects-types'
import {
  loadOverviewMonthOptions,
  mergeOverviewMonthOptions,
  type OverviewMonthOption,
  type OverviewMonthWindow,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'

/** Forward month spine for build delivery windows (`end_date` may exceed the historical picker). */
export const BUILD_DELIVERY_FORWARD_MONTH_WINDOW: OverviewMonthWindow = {
  monthsBefore: 0,
  monthsAfter: 36,
}

export type BuildProjectDeliveryInput = {
  projectId: string
  startDate: string | null
  endDate: string | null
}

export type BuildProjectExecutionWindow = {
  periodStart: string
  periodEnd: string | null
  monthKeys: string[]
}

export type BuildProjectDeliveryTotals = {
  plannedHours: number
  loggedHours: number
  billableHours: number
}

export type BuildProjectDeliveryGrain = {
  monthOptions: readonly OverviewMonthOption[]
  monthKeys: string[]
  plansByMonth: Map<string, ProjectPlanGrainRow[]>
  actuals: ProjectActualsRow[]
}

export function resolveBuildExecutionWindow(params: {
  periodStart: string
  periodEnd: string | null
  fallbackMonthStartStr: string
}): BuildProjectExecutionWindow {
  const throughMonthStartStr = params.periodEnd ?? params.fallbackMonthStartStr
  const monthKeys = monthStartsFromProjectStart(params.periodStart, throughMonthStartStr)

  return {
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    monthKeys,
  }
}

export async function resolveBuildExecutionStartDate(
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

export async function resolveBuildExecutionStartDates(
  projects: readonly BuildProjectDeliveryInput[],
  fallbackMonthStartStr: string
): Promise<Map<string, string>> {
  const byProject = new Map<string, string>()
  const missingStartIds: string[] = []

  for (const project of projects) {
    if (project.startDate) {
      byProject.set(project.projectId, project.startDate)
    } else {
      missingStartIds.push(project.projectId)
    }
  }

  if (missingStartIds.length === 0) {
    return byProject
  }

  const supabase = createServiceClientCached()
  const earliestByProject = new Map<string, string>()

  for (let i = 0; i < missingStartIds.length; i += 200) {
    const slice = missingStartIds.slice(i, i + 200)
    const { rows, error } = await pagedQuery<{ project_id: string; log_date: string }>(
      async (from) =>
        supabase
          .from('fact_worklogs')
          .select('project_id, log_date')
          .in('project_id', slice)
          .eq('is_pto', false)
          .order('log_date')
          .range(from, from + 999)
    )

    if (error) {
      for (const projectId of slice) {
        if (!byProject.has(projectId)) {
          byProject.set(projectId, fallbackMonthStartStr)
        }
      }
      continue
    }

    for (const row of rows) {
      if (!earliestByProject.has(row.project_id)) {
        earliestByProject.set(row.project_id, row.log_date)
      }
    }
  }

  for (const projectId of missingStartIds) {
    byProject.set(projectId, earliestByProject.get(projectId) ?? fallbackMonthStartStr)
  }

  return byProject
}

export async function loadBuildDeliveryMonthOptions(
  historicalOptions: readonly OverviewMonthOption[]
): Promise<{ options: OverviewMonthOption[]; error: string | null }> {
  const forwardRes = await loadOverviewMonthOptions(BUILD_DELIVERY_FORWARD_MONTH_WINDOW)
  if (forwardRes.error) {
    return { options: [], error: forwardRes.error }
  }

  return {
    options: mergeOverviewMonthOptions(historicalOptions, forwardRes.options),
    error: null,
  }
}

function unionMonthKeys(windows: readonly BuildProjectExecutionWindow[]): string[] {
  const keys = new Set<string>()
  for (const window of windows) {
    for (const key of window.monthKeys) {
      keys.add(key)
    }
  }
  return [...keys].sort()
}

export async function loadBuildProjectDeliveryGrain(params: {
  windows: readonly BuildProjectExecutionWindow[]
  historicalOptions: readonly OverviewMonthOption[]
  fallbackSnapshotId: string
}): Promise<{ grain: BuildProjectDeliveryGrain | null; error: string | null }> {
  const monthKeys = unionMonthKeys(params.windows)
  if (monthKeys.length === 0) {
    return {
      grain: {
        monthOptions: params.historicalOptions,
        monthKeys: [],
        plansByMonth: new Map(),
        actuals: [],
      },
      error: null,
    }
  }

  const monthOptionsRes = await loadBuildDeliveryMonthOptions(params.historicalOptions)
  if (monthOptionsRes.error) {
    return { grain: null, error: monthOptionsRes.error }
  }

  const [plansRes, actualsRes] = await Promise.all([
    loadProjectGrainPlansForMonths(
      monthKeys,
      monthOptionsRes.options,
      params.fallbackSnapshotId
    ),
    loadProjectActualsForMonthsFromOptions(
      monthKeys,
      monthOptionsRes.options,
      params.fallbackSnapshotId
    ),
  ])

  if (plansRes.error) {
    return { grain: null, error: plansRes.error }
  }
  if (actualsRes.error) {
    return { grain: null, error: actualsRes.error }
  }

  return {
    grain: {
      monthOptions: monthOptionsRes.options,
      monthKeys,
      plansByMonth: plansRes.rowsByMonth,
      actuals: actualsRes.rows,
    },
    error: null,
  }
}

export function sumBuildProjectDeliveryTotals(params: {
  projectId: string
  monthKeys: readonly string[]
  plansByMonth: ReadonlyMap<string, ProjectPlanGrainRow[]>
  actuals: readonly ProjectActualsRow[]
}): BuildProjectDeliveryTotals {
  let plannedHours = 0
  for (const monthKey of params.monthKeys) {
    const planRows = params.plansByMonth.get(monthKey) ?? []
    plannedHours += sumPlannedHoursByProject(planRows).get(params.projectId) ?? 0
  }

  let loggedHours = 0
  let billableHours = 0
  for (const row of params.actuals) {
    if (row.project_id !== params.projectId) continue
    if (!params.monthKeys.includes(row.month_date)) continue
    loggedHours += row.logged_hours
    billableHours += row.billable_hours
  }

  return {
    plannedHours: roundDisplayStat(plannedHours),
    loggedHours: roundDisplayStat(loggedHours),
    billableHours: roundDisplayStat(billableHours),
  }
}

export function buildBuildProjectExecutionSeries(params: {
  projectId: string
  monthKeys: readonly string[]
  plansByMonth: ReadonlyMap<string, ProjectPlanGrainRow[]>
  actuals: readonly ProjectActualsRow[]
}): ProjectExecutionPoint[] {
  const plannedByMonth = new Map<string, number>()
  for (const monthKey of params.monthKeys) {
    const planRows = params.plansByMonth.get(monthKey) ?? []
    const sums = sumPlannedHoursByProject(planRows)
    plannedByMonth.set(monthKey, roundDisplayStat(sums.get(params.projectId) ?? 0))
  }

  const loggedByMonth = new Map<string, number>()
  for (const row of params.actuals) {
    if (row.project_id !== params.projectId) continue
    if (!params.monthKeys.includes(row.month_date)) continue
    loggedByMonth.set(
      row.month_date,
      roundDisplayStat((loggedByMonth.get(row.month_date) ?? 0) + row.logged_hours)
    )
  }

  return buildPerMonthExecutionPoints(
    params.monthKeys,
    plannedByMonth,
    loggedByMonth,
    formatMonthKeyLabel
  )
}

export async function loadBuildProjectDeliveryMetrics(params: {
  projects: readonly BuildProjectDeliveryInput[]
  historicalOptions: readonly OverviewMonthOption[]
  fallbackSnapshotId: string
  fallbackMonthStartStr: string
}): Promise<{
  windowsByProject: Map<string, BuildProjectExecutionWindow>
  totalsByProject: Map<string, BuildProjectDeliveryTotals>
  grain: BuildProjectDeliveryGrain | null
  error: string | null
}> {
  const startDates = await resolveBuildExecutionStartDates(
    params.projects,
    params.fallbackMonthStartStr
  )

  const windowsByProject = new Map<string, BuildProjectExecutionWindow>()
  for (const project of params.projects) {
    const periodStart = startDates.get(project.projectId) ?? params.fallbackMonthStartStr
    windowsByProject.set(
      project.projectId,
      resolveBuildExecutionWindow({
        periodStart,
        periodEnd: project.endDate,
        fallbackMonthStartStr: params.fallbackMonthStartStr,
      })
    )
  }

  const grainRes = await loadBuildProjectDeliveryGrain({
    windows: [...windowsByProject.values()],
    historicalOptions: params.historicalOptions,
    fallbackSnapshotId: params.fallbackSnapshotId,
  })

  if (grainRes.error || !grainRes.grain) {
    return {
      windowsByProject,
      totalsByProject: new Map(),
      grain: null,
      error: grainRes.error,
    }
  }

  const totalsByProject = new Map<string, BuildProjectDeliveryTotals>()
  for (const project of params.projects) {
    const window = windowsByProject.get(project.projectId)
    if (!window) continue
    totalsByProject.set(
      project.projectId,
      sumBuildProjectDeliveryTotals({
        projectId: project.projectId,
        monthKeys: window.monthKeys,
        plansByMonth: grainRes.grain.plansByMonth,
        actuals: grainRes.grain.actuals,
      })
    )
  }

  return {
    windowsByProject,
    totalsByProject,
    grain: grainRes.grain,
    error: null,
  }
}
