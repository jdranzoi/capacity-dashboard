import type { SupabaseClient } from '@supabase/supabase-js'

import { roundDisplayStat } from '@/lib/format/display-stats'
import type { Database } from '@/lib/supabase/database.types'

const PAGE = 1000
const PERSON_IN_BATCH = 100

export type ProjectScopedHours = {
  plannedHours: number
  loggedHoursMtd: number
  billableHoursMtd: number
}

type PagedBatch<T> = { rows: T[]; error: string | null }

async function pagedQuery<T>(
  run: (from: number) => Promise<{ data: unknown; error: { message: string } | null }>
): Promise<PagedBatch<T>> {
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

/**
 * Sums planned and worklog hours for a single `dim_project` row, aligned with overview:
 * - Plans: `fact_plans` for snapshot + month, `is_pto = false`
 * - Worklogs: non-PTO, `log_date` in [monthStart, logThroughStr] (MTD / sync cap)
 *
 * When `personIdFilter` is set, restricts to those people (same scope as team KPI person filter).
 * When null, sums across all people (full org for that project).
 */
export async function loadProjectScopedHours(
  supabase: SupabaseClient<Database>,
  params: {
    snapshotId: string
    monthStartStr: string
    logThroughStr: string
    projectId: string
    personIdFilter: Set<string> | null
  }
): Promise<{ data: ProjectScopedHours; error: string | null }> {
  const { snapshotId, monthStartStr, logThroughStr, projectId, personIdFilter } = params

  if (personIdFilter && personIdFilter.size === 0) {
    return {
      data: {
        plannedHours: 0,
        loggedHoursMtd: 0,
        billableHoursMtd: 0,
      },
      error: null,
    }
  }

  let plannedTotal = 0

  const sumPlansBatch = async (personIds: string[] | null) => {
    const { rows, error } = await pagedQuery<{ planned_hours: number | null }>(
      async (from) => {
        let q = supabase
          .from('fact_plans')
          .select('planned_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .eq('project_id', projectId)
          .eq('is_pto', false)
          .order('id')
          .range(from, from + PAGE - 1)
        if (personIds && personIds.length > 0) {
          q = q.in('person_id', personIds)
        }
        return q
      }
    )
    if (error) return error
    for (const r of rows) plannedTotal += Number(r.planned_hours ?? 0)
    return null
  }

  if (personIdFilter == null) {
    const err = await sumPlansBatch(null)
    if (err) return { data: { plannedHours: 0, loggedHoursMtd: 0, billableHoursMtd: 0 }, error: err }
  } else {
    const list = Array.from(personIdFilter)
    for (let i = 0; i < list.length; i += PERSON_IN_BATCH) {
      const slice = list.slice(i, i + PERSON_IN_BATCH)
      const err = await sumPlansBatch(slice)
      if (err) return { data: { plannedHours: 0, loggedHoursMtd: 0, billableHoursMtd: 0 }, error: err }
    }
  }

  let loggedTotal = 0
  let billableTotal = 0

  const sumLogsBatch = async (personIds: string[] | null) => {
    const { rows, error } = await pagedQuery<{
      logged_seconds: number
      billable_seconds: number
    }>(async (from) => {
      let q = supabase
        .from('fact_worklogs')
        .select('logged_seconds, billable_seconds')
        .eq('project_id', projectId)
        .eq('is_pto', false)
        .gte('log_date', monthStartStr)
        .lte('log_date', logThroughStr)
        .order('id')
        .range(from, from + PAGE - 1)
      if (personIds && personIds.length > 0) {
        q = q.in('person_id', personIds)
      }
      return q
    })
    if (error) return error
    for (const r of rows) {
      loggedTotal += Number(r.logged_seconds) / 3600
      billableTotal += Number(r.billable_seconds) / 3600
    }
    return null
  }

  if (personIdFilter == null) {
    const err = await sumLogsBatch(null)
    if (err) return { data: { plannedHours: 0, loggedHoursMtd: 0, billableHoursMtd: 0 }, error: err }
  } else {
    const list = Array.from(personIdFilter)
    for (let i = 0; i < list.length; i += PERSON_IN_BATCH) {
      const slice = list.slice(i, i + PERSON_IN_BATCH)
      const err = await sumLogsBatch(slice)
      if (err) return { data: { plannedHours: 0, loggedHoursMtd: 0, billableHoursMtd: 0 }, error: err }
    }
  }

  return {
    data: {
      plannedHours: roundDisplayStat(plannedTotal),
      loggedHoursMtd: roundDisplayStat(loggedTotal),
      billableHoursMtd: roundDisplayStat(billableTotal),
    },
    error: null,
  }
}
