import { cacheLife, cacheTag } from 'next/cache'
import { format, startOfMonth } from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import { CACHE_TAG_OVERVIEW_MONTHS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { plannedPct } from '@/lib/domain/workload-metrics'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { loadOverviewMonthOptions, type OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { formatMonthLabel } from '@/lib/overview/working-days'
import { createServiceClientCached } from '@/lib/supabase/server'
import { parseISO } from 'date-fns'

const PAGE = 1000
const HORIZON_MONTHS = 6

export type HorizonMonthPoint = {
  monthKey: string
  monthLabel: string
  netCapacityHours: number
  plannedHours: number
  benchHours: number
  plannedCoveragePct: number | null
  gapHours: number
  isCurrent: boolean
}

export type CapacityHorizonPayload = {
  months: HorizonMonthPoint[]
  currentMonthKey: string
}

async function aggregateMonthTotals(
  option: OverviewMonthOption
): Promise<{ netCapacity: number; planned: number; bench: number; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(cacheTagSnapshot(option.snapshotId))

  const supabase = createServiceClientCached()

  const [capRes, planRes, benchRes] = await Promise.all([
    pagedQuery<{ net_capacity_hours: number }>(async (from) =>
      supabase
        .from('fact_capacity')
        .select('net_capacity_hours')
        .eq('snapshot_id', option.snapshotId)
        .eq('month_date', option.monthStartStr)
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<{ planned_hours: number }>(async (from) =>
      supabase
        .from('fact_plans')
        .select('planned_hours')
        .eq('snapshot_id', option.snapshotId)
        .eq('month_date', option.monthStartStr)
        .eq('is_pto', false)
        .range(from, from + PAGE - 1)
    ),
    pagedQuery<{ availability_hours: number | null }>(async (from) =>
      supabase
        .from('fact_bench')
        .select('availability_hours')
        .eq('snapshot_id', option.snapshotId)
        .eq('month_date', option.monthStartStr)
        .range(from, from + PAGE - 1)
    ),
  ])

  if (capRes.error) return { netCapacity: 0, planned: 0, bench: 0, error: capRes.error }
  if (planRes.error) return { netCapacity: 0, planned: 0, bench: 0, error: planRes.error }
  if (benchRes.error) return { netCapacity: 0, planned: 0, bench: 0, error: benchRes.error }

  const netCapacity = capRes.rows.reduce((s, r) => s + Number(r.net_capacity_hours), 0)
  const planned = planRes.rows.reduce((s, r) => s + Number(r.planned_hours ?? 0), 0)
  const bench = benchRes.rows.reduce((s, r) => s + Number(r.availability_hours ?? 0), 0)

  return { netCapacity, planned, bench, error: null }
}

export async function loadCapacityHorizon(
  selectedMonthKey: string
): Promise<{ data: CapacityHorizonPayload | null; error: string | null }> {
  const { options, error: optErr } = await loadOverviewMonthOptions()
  if (optErr) return { data: null, error: optErr }
  if (options.length === 0) return { data: null, error: null }

  // Take the most recent HORIZON_MONTHS, ordered chronologically
  const slice = options.slice(0, HORIZON_MONTHS).reverse()

  const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM')

  const results = await Promise.all(slice.map((opt) => aggregateMonthTotals(opt)))

  const months: HorizonMonthPoint[] = []
  for (let i = 0; i < slice.length; i++) {
    const opt = slice[i]
    const totals = results[i]
    if (totals.error) return { data: null, error: totals.error }

    const net = roundDisplayStat(totals.netCapacity)
    const planned = roundDisplayStat(totals.planned)
    const bench = roundDisplayStat(totals.bench)

    months.push({
      monthKey: opt.monthKey,
      monthLabel: formatMonthLabel(parseISO(opt.monthStartStr)),
      netCapacityHours: net,
      plannedHours: planned,
      benchHours: bench,
      plannedCoveragePct: plannedPct(planned, net),
      gapHours: roundDisplayStat(net - planned),
      isCurrent: opt.monthKey === selectedMonthKey,
    })
  }

  return {
    data: { months, currentMonthKey },
    error: null,
  }
}
