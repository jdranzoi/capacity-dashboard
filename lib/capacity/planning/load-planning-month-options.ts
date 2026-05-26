import { cacheLife, cacheTag } from 'next/cache'
import { format, parseISO } from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import { CACHE_TAG_MONTH_FACTS, CACHE_TAG_OVERVIEW_MONTHS } from '@/lib/data/cache-tags'
import { formatMonthLabel } from '@/lib/overview/working-days'
import {
  loadOverviewMonthOptions,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

type MonthSnapshotRow = {
  month_date: string
  snapshot_id: string
}

function pairKey(snapshotId: string, monthDate: string): string {
  return `${snapshotId}:${monthDate}`
}

async function loadPlanMonthSnapshotPairs(): Promise<{
  pairs: Set<string>
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS)

  const supabase = createServiceClientCached()
  const result = await pagedQuery<MonthSnapshotRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('month_date, snapshot_id')
      .eq('is_pto', false)
      .gt('planned_hours', 0)
      .order('month_date')
      .order('snapshot_id')
      .range(from, from + PAGE - 1)
  )

  if (result.error) return { pairs: new Set(), error: result.error }

  const pairs = new Set<string>()
  for (const row of result.rows) {
    pairs.add(pairKey(row.snapshot_id, row.month_date))
  }
  return { pairs, error: null }
}

async function loadCapacityMonthSnapshotPairs(): Promise<{
  pairs: Set<string>
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS)

  const supabase = createServiceClientCached()
  const result = await pagedQuery<MonthSnapshotRow>(async (from) =>
    supabase
      .from('fact_capacity')
      .select('month_date, snapshot_id')
      .order('month_date')
      .order('snapshot_id')
      .range(from, from + PAGE - 1)
  )

  if (result.error) return { pairs: new Set(), error: result.error }

  const pairs = new Set<string>()
  for (const row of result.rows) {
    pairs.add(pairKey(row.snapshot_id, row.month_date))
  }
  return { pairs, error: null }
}

/**
 * Planning horizon months: present in both `fact_plans` (non-PTO, planned > 0) and
 * `fact_capacity` for the same snapshot/month, anchored via `v_dashboard_month_options`.
 */
export function intersectPlanningMonthOptions(
  spineOptions: OverviewMonthOption[],
  planPairs: Set<string>,
  capacityPairs: Set<string>
): OverviewMonthOption[] {
  return spineOptions.filter(
    (opt) =>
      planPairs.has(pairKey(opt.snapshotId, opt.monthStartStr)) &&
      capacityPairs.has(pairKey(opt.snapshotId, opt.monthStartStr))
  )
}

export async function loadPlanningMonthOptions(): Promise<{
  options: OverviewMonthOption[]
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_OVERVIEW_MONTHS, CACHE_TAG_MONTH_FACTS)

  const [spineResult, planResult, capResult] = await Promise.all([
    loadOverviewMonthOptions('from-current-forward'),
    loadPlanMonthSnapshotPairs(),
    loadCapacityMonthSnapshotPairs(),
  ])

  if (spineResult.error) return { options: [], error: spineResult.error }
  if (planResult.error) return { options: [], error: planResult.error }
  if (capResult.error) return { options: [], error: capResult.error }

  const eligible = intersectPlanningMonthOptions(
    spineResult.options,
    planResult.pairs,
    capResult.pairs
  )

  const options = eligible.map((o) => ({
    ...o,
    label: formatMonthLabel(parseISO(o.monthStartStr)),
  }))

  return { options, error: null }
}
