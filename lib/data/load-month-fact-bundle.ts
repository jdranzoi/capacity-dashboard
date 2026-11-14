import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

import { pagedQuery } from '@/lib/data/paged-query'
import { DELIVERY_PLAN_FILTER } from '@/lib/data/delivery-plan-filter'
import {
  CACHE_TAG_MONTH_FACTS,
  cacheTagSnapshot,
} from '@/lib/data/cache-tags'
import {
  ptoHoursByPersonDay,
  type PtoDayRow,
  type PtoPlanItem,
} from '@/lib/domain/pto-by-day'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

export type MonthFactCapacityRow = {
  person_id: string
  zone_id: string | null
  net_capacity_hours: number
  pto_hours: number
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

type PtoWorklogRow = {
  person_id: string
  log_date: string
  logged_seconds: number
}

export type MonthFactHolidayRow = {
  zone_id: string
  date: string
}

/**
 * Facts for capacity KPIs of one snapshot month. Every person-level list is limited
 * to the KPI population: people with a `fact_capacity` row (in-scope roles, no
 * contractors — D-028, D-032). Project views read `fact_worklogs` directly and keep
 * contractor hours.
 */
export type MonthFactBundle = {
  capacity: MonthFactCapacityRow[]
  /** Delivery plans only (`DELIVERY_PLAN_FILTER`). */
  plans: MonthFactPlanRow[]
  /** Non-PTO worklogs for the whole calendar month. */
  worklogs: MonthFactWorklogRow[]
  /**
   * PTO hours per working day (`ptoHoursByPersonDay`): logged before the snapshot
   * day, planned from it on. Sums to `fact_capacity.pto_hours` per person.
   */
  ptoDays: PtoDayRow[]
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

  const [snapRes, capRes, planRes, wlRes, ptoWlRes, ptoPlanRes, holidayRes] = await Promise.all([
    supabase.from('sync_snapshot').select('created_at').eq('id', snapshotId).maybeSingle(),
    pagedQuery<MonthFactCapacityRow>(async (from) =>
      supabase
        .from('fact_capacity')
        .select('person_id, zone_id, net_capacity_hours, pto_hours')
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
        .or(DELIVERY_PLAN_FILTER)
        .order('id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<MonthFactWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, project_id, log_date, billable_seconds, logged_seconds, is_commercial')
        .eq('is_pto', false)
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .order('id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<PtoWorklogRow>(async (from) =>
      supabase
        .from('fact_worklogs')
        .select('person_id, log_date, logged_seconds')
        .eq('is_pto', true)
        .gte('log_date', monthStartStr)
        .lte('log_date', monthEndStr)
        .order('id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<PtoPlanItem>(async (from) =>
      supabase
        .from('fact_pto_plan')
        .select('person_id, start_date, end_date, hours_per_day, rule, recurrence_end_date')
        .eq('snapshot_id', snapshotId)
        .lte('start_date', monthEndStr)
        .order('id')
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

  if (snapRes.error || !snapRes.data?.created_at) {
    return { data: null, error: `sync_snapshot: ${snapRes.error?.message ?? 'snapshot not found'}` }
  }
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
  if (ptoPlanRes.error) {
    return { data: null, error: `fact_pto_plan: ${ptoPlanRes.error}` }
  }
  if (holidayRes.error) {
    return { data: null, error: `dim_holiday: ${holidayRes.error}` }
  }

  const population = new Set(capRes.rows.map((r) => r.person_id))
  const zoneIdByPerson = new Map(capRes.rows.map((r) => [r.person_id, r.zone_id]))
  const holidaysByZone = new Map<string, Set<string>>()
  for (const { zone_id, date } of holidayRes.rows) {
    let set = holidaysByZone.get(zone_id)
    if (!set) {
      set = new Set()
      holidaysByZone.set(zone_id, set)
    }
    set.add(date)
  }

  // The sync splits logged vs planned PTO at its own run date (UTC).
  const cutoffDate = snapRes.data.created_at.slice(0, 10)
  const ptoDays = ptoHoursByPersonDay({
    monthStart: monthStartStr,
    monthEnd: monthEndStr,
    cutoffDate,
    personIds: population,
    zoneIdByPerson,
    holidaysByZone,
    loggedPto: ptoWlRes.rows,
    plannedPto: ptoPlanRes.rows,
  })

  return {
    data: {
      capacity: capRes.rows,
      plans: planRes.rows.filter((r) => population.has(r.person_id)),
      worklogs: wlRes.rows.filter((r) => population.has(r.person_id)),
      ptoDays,
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
