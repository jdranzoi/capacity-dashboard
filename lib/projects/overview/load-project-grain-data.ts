import { cacheLife, cacheTag } from 'next/cache'
import {
  addMonths,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { roundDisplayStat } from '@/lib/format/display-stats'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'

export type ProjectActualsRow = {
  project_id: string
  month_date: string
  logged_hours: number
  billable_hours: number
}

export type ProjectPlanGrainRow = {
  person_id: string
  project_id: string
  role_id: string | null
  planned_hours: number
}

export async function loadProjectActualsForMonths(
  snapshotId: string,
  monthDates: readonly string[]
): Promise<{ rows: ProjectActualsRow[]; error: string | null }> {
  if (monthDates.length === 0) {
    return { rows: [], error: null }
  }

  const supabase = createServiceClientCached()
  const { rows, error } = await pagedQuery<{
    project_id: string
    month_date: string
    logged_hours: number
    billable_hours: number
  }>(async (from) =>
    supabase
      .from('fact_project_actuals')
      .select('project_id, month_date, logged_hours, billable_hours')
      .eq('snapshot_id', snapshotId)
      .in('month_date', [...monthDates])
      .order('project_id')
      .range(from, from + 999)
  )

  if (error) {
    return { rows: [], error }
  }

  return {
    rows: rows.map((r) => ({
      project_id: r.project_id,
      month_date: r.month_date,
      logged_hours: Number(r.logged_hours ?? 0),
      billable_hours: Number(r.billable_hours ?? 0),
    })),
    error: null,
  }
}

function groupMonthKeysBySnapshot(
  monthKeys: readonly string[],
  options: readonly OverviewMonthOption[],
  fallbackSnapshotId?: string
): Map<string, string[]> {
  const snapshotByMonth = new Map(
    options.map((o) => [o.monthStartStr, o.snapshotId] as const)
  )
  const bySnapshot = new Map<string, string[]>()
  for (const monthKey of monthKeys) {
    const snapshotId = snapshotByMonth.get(monthKey) ?? fallbackSnapshotId
    if (!snapshotId) continue
    const list = bySnapshot.get(snapshotId) ?? []
    list.push(monthKey)
    bySnapshot.set(snapshotId, list)
  }
  return bySnapshot
}

/** `fact_project_actuals` for each month using that month's sync anchor from month options. */
export async function loadProjectActualsForMonthsFromOptions(
  monthKeys: readonly string[],
  options: readonly OverviewMonthOption[],
  fallbackSnapshotId?: string
): Promise<{ rows: ProjectActualsRow[]; error: string | null }> {
  if (monthKeys.length === 0) {
    return { rows: [], error: null }
  }

  const bySnapshot = groupMonthKeysBySnapshot(monthKeys, options, fallbackSnapshotId)
  if (bySnapshot.size === 0) {
    return { rows: [], error: 'No sync snapshot found for requested months' }
  }

  const batches = await Promise.all(
    Array.from(bySnapshot.entries()).map(([snapshotId, months]) =>
      loadProjectActualsForMonths(snapshotId, months)
    )
  )

  const batchError = batches.find((b) => b.error)?.error ?? null
  if (batchError) {
    return { rows: [], error: batchError }
  }

  return { rows: batches.flatMap((b) => b.rows), error: null }
}

export async function loadProjectGrainPlans(
  snapshotId: string,
  monthStartStr: string
): Promise<{ rows: ProjectPlanGrainRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()

  const { rows, error } = await pagedQuery<ProjectPlanGrainRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, project_id, role_id, planned_hours')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .not('project_id', 'is', null)
      .order('project_id')
      .range(from, from + 999)
  )

  if (error) {
    return { rows: [], error }
  }

  return {
    rows: rows
      .filter((r) => r.project_id != null)
      .map((r) => ({
        person_id: r.person_id,
        project_id: r.project_id!,
        role_id: r.role_id,
        planned_hours: Number(r.planned_hours ?? 0),
      })),
    error: null,
  }
}

/** `fact_plans` per month, each keyed to that month's sync anchor from month options. */
export async function loadProjectGrainPlansForMonths(
  monthKeys: readonly string[],
  options: readonly OverviewMonthOption[],
  fallbackSnapshotId?: string
): Promise<{ rowsByMonth: Map<string, ProjectPlanGrainRow[]>; error: string | null }> {
  const rowsByMonth = new Map<string, ProjectPlanGrainRow[]>()
  if (monthKeys.length === 0) {
    return { rowsByMonth, error: null }
  }

  const bySnapshot = groupMonthKeysBySnapshot(monthKeys, options, fallbackSnapshotId)
  if (bySnapshot.size === 0) {
    return { rowsByMonth, error: 'No sync snapshot found for requested months' }
  }

  for (const [snapshotId, months] of bySnapshot) {
    const batchResults = await Promise.all(
      months.map((monthKey) => loadProjectGrainPlans(snapshotId, monthKey))
    )
    const batchError = batchResults.find((r) => r.error)?.error ?? null
    if (batchError) {
      return { rowsByMonth, error: batchError }
    }
    for (let i = 0; i < months.length; i++) {
      rowsByMonth.set(months[i]!, batchResults[i]!.rows)
    }
  }

  for (const monthKey of monthKeys) {
    if (!rowsByMonth.has(monthKey)) {
      rowsByMonth.set(monthKey, [])
    }
  }

  return { rowsByMonth, error: null }
}

/**
 * Lifetime planned hours for global delivery view: sum of `fact_plans` per calendar month
 * from project start through the anchor month, each month using its sync from
 * `v_dashboard_month_options` (matches the execution chart monthly bars).
 */
export async function loadLifetimePlannedHoursByProject(params: {
  anchorMonthStartStr: string
  options: readonly OverviewMonthOption[]
  projects: readonly { id: string; start_date: string | null }[]
}): Promise<{ byProject: Map<string, number>; error: string | null }> {
  const availableMonthKeys = params.options
    .map((o) => o.monthStartStr)
    .filter((m) => m <= params.anchorMonthStartStr)
    .sort()

  const byProject = new Map<string, number>()
  if (availableMonthKeys.length === 0 || params.projects.length === 0) {
    return { byProject, error: null }
  }

  const { rowsByMonth, error } = await loadProjectGrainPlansForMonths(
    availableMonthKeys,
    params.options
  )
  if (error) {
    return { byProject, error }
  }

  for (const project of params.projects) {
    const monthKeys = monthStartsFromProjectStart(
      project.start_date,
      params.anchorMonthStartStr
    ).filter((m) => availableMonthKeys.includes(m))

    let sum = 0
    for (const monthKey of monthKeys) {
      const rows = rowsByMonth.get(monthKey) ?? []
      sum += sumPlannedHoursByProject(rows).get(project.id) ?? 0
    }
    byProject.set(project.id, roundDisplayStat(sum))
  }

  return { byProject, error: null }
}

/** Planned hours summed by project for one snapshot month. */
export function sumPlannedHoursByProject(
  planRows: readonly ProjectPlanGrainRow[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of planRows) {
    if (row.planned_hours <= 0) continue
    map.set(row.project_id, (map.get(row.project_id) ?? 0) + row.planned_hours)
  }
  return map
}

export function lastNMonthStarts(anchorMonthStartStr: string, count: number): string[] {
  const anchor = parse(anchorMonthStartStr, 'yyyy-MM-dd', new Date())
  const keys: string[] = []
  for (let i = 0; i < count; i++) {
    keys.push(format(subMonths(anchor, i), 'yyyy-MM-dd'))
  }
  return keys
}

export function monthStartsForExecutionSeries(
  anchorMonthStartStr: string,
  count: number
): string[] {
  const anchor = parse(anchorMonthStartStr, 'yyyy-MM-dd', new Date())
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    keys.push(format(subMonths(anchor, i), 'yyyy-MM-dd'))
  }
  return keys
}

/** Inclusive month keys from project start through the anchor month (capped). */
export function monthStartsFromProjectStart(
  startDate: string | null,
  throughMonthStartStr: string,
  maxMonths = 36
): string[] {
  const through = startOfMonth(parse(throughMonthStartStr, 'yyyy-MM-dd', new Date()))
  if (!startDate) {
    return [throughMonthStartStr]
  }
  const start = startOfMonth(parse(startDate, 'yyyy-MM-dd', new Date()))
  if (start > through) {
    return [throughMonthStartStr]
  }
  const months = eachMonthOfInterval({ start, end: through })
  if (months.length <= maxMonths) {
    return months.map((m) => format(m, 'yyyy-MM-dd'))
  }
  return months.slice(-maxMonths).map((m) => format(m, 'yyyy-MM-dd'))
}

/** ISO week starts (Monday) from start date through end date (inclusive). */
export function weekStartsInRange(startDateStr: string, endDateStr: string): string[] {
  const start = startOfWeek(parse(startDateStr, 'yyyy-MM-dd', new Date()), { weekStartsOn: 1 })
  const end = parse(endDateStr, 'yyyy-MM-dd', new Date())
  if (start > end) {
    return [format(start, 'yyyy-MM-dd')]
  }
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w) =>
    format(w, 'yyyy-MM-dd')
  )
}

export function formatMonthKeyLabel(monthStartStr: string): string {
  const d = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  return format(d, 'MMM yyyy')
}

export function nextMonthStart(monthStartStr: string): string {
  const d = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  return format(addMonths(d, 1), 'yyyy-MM-dd')
}
