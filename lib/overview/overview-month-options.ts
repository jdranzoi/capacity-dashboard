import { cacheLife, cacheTag } from 'next/cache'
import { createServiceClientCached } from '@/lib/supabase/server'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'

import { CACHE_TAG_OVERVIEW_MONTHS } from '@/lib/data/cache-tags'
import { formatMonthLabel } from '@/lib/overview/working-days'

export type OverviewMonthOption = {
  /** `yyyy-MM` for the `month` search param */
  monthKey: string
  /** First calendar day of the month (`yyyy-MM-dd`, matches `fact_*`.`month_date`). */
  monthStartStr: string
  /** e.g. "May 2026" */
  label: string
  snapshotId: string
  syncCreatedAt: string
}

/**
 * Picks the month from `?month=` when valid; otherwise current calendar month when present in options;
 * else the first option (newest data).
 */
export function resolveSelectedOverviewMonth(
  options: OverviewMonthOption[],
  monthParam: string | undefined
): OverviewMonthOption | null {
  if (options.length === 0) return null
  if (monthParam) {
    const hit = options.find((o) => o.monthKey === monthParam)
    if (hit) return hit
  }
  const currentKey = format(startOfMonth(new Date()), 'yyyy-MM')
  return options.find((o) => o.monthKey === currentKey) ?? options[0]
}

type DashboardMonthOptionRow = {
  month_date: string
  snapshot_id: string
  sync_created_at: string
}

/**
 * Elapsed calendar months in `fact_capacity`, each with the newest `sync_snapshot` for that
 * `month_date`. Backed by `v_dashboard_month_options` (migration 016 in capacity-mcp).
 */
export async function loadOverviewMonthOptions(): Promise<{
  options: OverviewMonthOption[]
  error: string | null
}> {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAG_OVERVIEW_MONTHS)

  const supabase = createServiceClientCached()
  const { data, error } = await supabase
    .from('v_dashboard_month_options')
    .select('month_date, snapshot_id, sync_created_at')
    .order('month_date', { ascending: false })

  if (error) {
    return { options: [], error: error.message }
  }

  const ceiling = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  const rows = (data as DashboardMonthOptionRow[] | null) ?? []

  const options: OverviewMonthOption[] = rows
    .filter((row) => row.month_date <= ceiling)
    .map((row) => ({
      monthKey: row.month_date.slice(0, 7),
      monthStartStr: row.month_date,
      label: formatMonthLabel(parseISO(row.month_date)),
      snapshotId: row.snapshot_id,
      syncCreatedAt: row.sync_created_at,
    }))

  return { options, error: null }
}
