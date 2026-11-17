import { cacheLife, cacheTag } from 'next/cache'

import type { CapacityYearOpsRow } from '@/lib/capacity/overview/load-capacity-year-facts'
import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { DELIVERY_PLAN_FILTER } from '@/lib/data/delivery-plan-filter'
import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

/**
 * Person-month rows for months not synced yet (after the current month), shaped like
 * `fact_month_ops` so the year matrix treats them the same way.
 *
 * Source is the latest snapshot: `fact_capacity` is the month's population (in-scope
 * roles, no contractors, employed days — D-028, D-032, D-034) with net capacity, planned
 * PTO (D-030) and month role; `fact_plans` adds delivery plans only (D-029) of that
 * population. Nothing is logged or elapsed yet, so those fields are 0.
 */
export async function loadCapacityPlanMonths(params: {
  snapshotId: string
  fromMonth: string
  toMonth: string
}): Promise<{ rows: CapacityYearOpsRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(params.snapshotId))

  const { snapshotId, fromMonth, toMonth } = params
  const supabase = createServiceClientCached()
  const [capacity, plans] = await Promise.all([
    pagedQuery<{
      person_id: string
      month_date: string
      role_id: string | null
      net_capacity_hours: number
      pto_hours: number
    }>(async (from) =>
      supabase
        .from('fact_capacity')
        .select('person_id, month_date, role_id, net_capacity_hours, pto_hours')
        .eq('snapshot_id', snapshotId)
        .gte('month_date', fromMonth)
        .lte('month_date', toMonth)
        .order('month_date')
        .order('person_id')
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<{ person_id: string; month_date: string; planned_hours: number | null }>(
      async (from) =>
        supabase
          .from('fact_plans')
          .select('person_id, month_date, planned_hours')
          .eq('snapshot_id', snapshotId)
          .gte('month_date', fromMonth)
          .lte('month_date', toMonth)
          .or(DELIVERY_PLAN_FILTER)
          .order('id')
          .range(from, from + PAGE - 1)
    ),
  ])

  if (capacity.error) return { rows: [], error: `fact_capacity: ${capacity.error}` }
  if (plans.error) return { rows: [], error: `fact_plans: ${plans.error}` }

  // Plans of people outside the month's population (contractors, people who left) do not count.
  const plannedByPersonMonth = new Map<string, number>()
  for (const plan of plans.rows) {
    const key = `${plan.person_id}|${plan.month_date}`
    plannedByPersonMonth.set(key, (plannedByPersonMonth.get(key) ?? 0) + Number(plan.planned_hours ?? 0))
  }

  return {
    rows: capacity.rows.map((cap) => ({
      person_id: cap.person_id,
      month_date: cap.month_date,
      role_id: cap.role_id,
      net_capacity_hours: Number(cap.net_capacity_hours),
      planned_hours: plannedByPersonMonth.get(`${cap.person_id}|${cap.month_date}`) ?? 0,
      logged_hours: 0,
      commercial_logged_hours: 0,
      non_commercial_logged_hours: 0,
      pto_hours: Number(cap.pto_hours),
      elapsed_net_weekdays: 0,
    })),
    error: null,
  }
}
