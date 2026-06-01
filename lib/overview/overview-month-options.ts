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

/** `through-current` — overview/historical pickers. `from-current-forward` — planning horizon. */
export type OverviewMonthWindow = 'through-current' | 'from-current-forward'

function filterDashboardMonthRows(
  rows: DashboardMonthOptionRow[],
  window: OverviewMonthWindow
): DashboardMonthOptionRow[] {
  const currentKey = format(startOfMonth(new Date()), 'yyyy-MM')
  const ceiling = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  if (window === 'from-current-forward') {
    return rows.filter((row) => row.month_date.slice(0, 7) >= currentKey)
  }
  return rows.filter((row) => row.month_date <= ceiling)
}

/**
 * Calendar months in `fact_capacity`, each with the newest `sync_snapshot` for that
 * `month_date`. Backed by `v_dashboard_month_options` (migration 016 in capacity-mcp).
 */
export async function loadOverviewMonthOptions(
  window: OverviewMonthWindow = 'through-current'
): Promise<{
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

  const rows = filterDashboardMonthRows((data as DashboardMonthOptionRow[] | null) ?? [], window)

  const options: OverviewMonthOption[] = rows
    .map((row) => ({
      monthKey: row.month_date.slice(0, 7),
      monthStartStr: row.month_date,
      label: formatMonthLabel(parseISO(row.month_date)),
      snapshotId: row.snapshot_id,
      syncCreatedAt: row.sync_created_at,
    }))

  return { options, error: null }
}

/**
 * Newest `sync_snapshot` for a calendar month (`fact_*`.`month_date`), from
 * `v_dashboard_month_options`. Use instead of `getLatestSyncSnapshot()` when facts
 * must reflect the last sync that targeted that month.
 */
export async function resolveSnapshotForMonth(
  monthStartStr: string
): Promise<{ id: string; createdAt: string } | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAG_OVERVIEW_MONTHS)

  const supabase = createServiceClientCached()
  const { data, error } = await supabase
    .from('v_dashboard_month_options')
    .select('snapshot_id, sync_created_at')
    .eq('month_date', monthStartStr)
    .maybeSingle()

  if (error || !data?.snapshot_id || !data.sync_created_at) return null
  return {
    id: data.snapshot_id,
    createdAt: data.sync_created_at,
  }
}
