import { connection } from 'next/server'
import { createServiceClientCached } from '@/lib/supabase/server'
import { endOfMonth, format, parseISO } from 'date-fns'

import { formatMonthLabel } from '@/lib/overview/working-days'

const PAGE = 1000

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

type FactCapacityJoinRow = {
  month_date: string
  snapshot_id: string
  sync_snapshot: {
    created_at: string | null
    taken_at: string
  } | null
}

/**
 * Elapsed calendar months that appear in `fact_capacity`, each paired with the **newest**
 * `sync_snapshot` (by `created_at`, else `taken_at`) among snapshots that still have rows
 * for that `month_date`.
 *
 * **Temporary:** full table scan via paged reads. Replace with a consolidated month rollup
 * (one row per month + chosen snapshot) when that table exists.
 */
export async function loadOverviewMonthOptions(): Promise<{
  options: OverviewMonthOption[]
  error: string | null
}> {
  await connection()
  const supabase = createServiceClientCached()
  const best = new Map<string, { snapshotId: string; createdAt: string }>()

  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('fact_capacity')
      .select(
        `
        month_date,
        snapshot_id,
        sync_snapshot!inner ( created_at, taken_at )
      `
      )
      .range(from, from + PAGE - 1)

    if (error) {
      return { options: [], error: error.message }
    }

    const batch = (data as FactCapacityJoinRow[] | null) ?? []
    if (batch.length === 0) break

    for (const row of batch) {
      const snap = row.sync_snapshot
      if (!snap) continue
      const createdAt = snap.created_at ?? snap.taken_at
      if (!createdAt) continue

      const prev = best.get(row.month_date)
      if (!prev || parseISO(createdAt) > parseISO(prev.createdAt)) {
        best.set(row.month_date, {
          snapshotId: row.snapshot_id,
          createdAt,
        })
      }
    }

    if (batch.length < PAGE) break
    from += PAGE
  }

  const ceiling = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const options: OverviewMonthOption[] = Array.from(best.entries())
    .filter(([monthStartStr]) => monthStartStr <= ceiling)
    .map(([monthStartStr, { snapshotId, createdAt }]) => ({
      monthKey: monthStartStr.slice(0, 7),
      monthStartStr,
      label: formatMonthLabel(parseISO(monthStartStr)),
      snapshotId,
      syncCreatedAt: createdAt,
    }))
    .sort((a, b) => b.monthStartStr.localeCompare(a.monthStartStr))

  return { options, error: null }
}
