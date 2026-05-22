import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

import { pagedQuery } from '@/lib/data/paged-query'

const PAGE = 1000
import {
  CACHE_TAG_MONTH_FACTS,
  cacheTagSnapshot,
} from '@/lib/data/cache-tags'
import { createServiceClientCached } from '@/lib/supabase/server'

export type MonthFactCapacityRow = {
  person_id: string
  net_capacity_hours: number
}

export type MonthFactPlanRow = {
  person_id: string
  planned_hours: number | null
}

export type MonthFactWorklogRow = {
  person_id: string
  project_id: string
  log_date: string
  billable_seconds: number
  logged_seconds: number
  is_commercial: boolean
}

export type MonthFactPtoWorklogRow = {
  person_id: string
  log_date: string
  logged_seconds: number
}

export type MonthFactHolidayRow = {
  zone_id: string
  date: string
}

export type MonthFactBundle = {
  capacity: MonthFactCapacityRow[]
  plans: MonthFactPlanRow[]
  worklogs: MonthFactWorklogRow[]
  ptoWorklogs: MonthFactPtoWorklogRow[]
  holidays: MonthFactHolidayRow[]
}

export type MonthFactBundleResult = {
  data: MonthFactBundle | null
  error: string | null
}

/**
 * Paginated fact reads for one snapshot month. Cached across requests; consumers apply
 * `overviewLogThroughDate` and person filters in memory.
 */
async function loadMonthFactBundleCached(
  snapshotId: string,
  monthStartStr: string,
  monthEndStr: string
): Promise<MonthFactBundleResult> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()

  const [capRes, planRes, wlRes, ptoWlRes, holidayRes] = await Promise.all([
    pagedQuery<MonthFactCapacityRow>(async (from) =>
      supabase
        .from('fact_capacity')
        .select('person_id, net_capacity_hours')
        .eq('snapshot_id', snapshotId)
        .eq('month_date', monthStartStr)
        .order('person_id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<MonthFactPlanRow>(async (from) =>
      supabase
        .from('fact_plans')
        .select('person_id, planned_hours')
        .eq('snapshot_id', snapshotId)
        .eq('month_date', monthStartStr)
        .eq('is_pto', false)
        .order('person_id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<MonthFactWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, project_id, log_date, billable_seconds, logged_seconds, is_commercial')
        .eq('is_pto', false)
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .order('log_date', { ascending: true })
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<MonthFactPtoWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, log_date, logged_seconds')
        .eq('is_pto', true)
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .order('log_date', { ascending: true })
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<MonthFactHolidayRow>(async (from) =>
      supabase
        .from('dim_holiday')
        .select('zone_id, date')
        .gte('date', monthStartStr)
        .lte('date', monthEndStr)
        .order('date')
        .range(from, from + PAGE - 1)
    ),
  ])

  if (capRes.error) {
    return { data: null, error: `fact_capacity: ${capRes.error}` }
  }
  if (planRes.error) {
    return { data: null, error: `fact_plans: ${planRes.error}` }
  }
  if (wlRes.error) {
    return { data: null, error: `fact_worklogs: ${wlRes.error}` }
  }
  if (ptoWlRes.error) {
    return { data: null, error: `fact_worklogs (PTO): ${ptoWlRes.error}` }
  }
  if (holidayRes.error) {
    return { data: null, error: `dim_holiday: ${holidayRes.error}` }
  }

  return {
    data: {
      capacity: capRes.rows,
      plans: planRes.rows,
      worklogs: wlRes.rows,
      ptoWorklogs: ptoWlRes.rows,
      holidays: holidayRes.rows,
    },
    error: null,
  }
}

/** Request-scoped dedup on top of cross-request `'use cache'`. */
export const getMonthFactBundle = cache(loadMonthFactBundleCached)

export function filterRowsByPerson<T extends { person_id: string }>(
  rows: T[],
  personIdFilter: Set<string> | null | undefined
): T[] {
  if (personIdFilter == null) return rows
  return rows.filter((r) => personIdFilter.has(r.person_id))
}

export function filterWorklogsThrough<T extends { log_date: string }>(
  rows: T[],
  logThroughStr: string
): T[] {
  return rows.filter((r) => r.log_date <= logThroughStr)
}

export function filterHolidaysThrough(
  rows: MonthFactHolidayRow[],
  logThroughStr: string
): MonthFactHolidayRow[] {
  return rows.filter((r) => r.date <= logThroughStr)
}
