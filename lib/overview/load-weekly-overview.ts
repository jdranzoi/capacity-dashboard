import { connection } from 'next/server'
import { createServiceClientCached } from '@/lib/supabase/server'
import { getLatestSyncSnapshot } from '@/lib/data/latest-sync-snapshot'
import { buildWeekdayWeightMap } from '@/lib/overview/prorate-to-weeks'
import {
  addDays,
  endOfMonth,
  format,
  min as minDate,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { formatMonthLabel } from './working-days'

const PAGE = 1000

function roundH(n: number): number {
  return Math.round(n * 10) / 10
}

export type WeeklyHeadline = {
  weekLabel: string
  weekStart: string
  /** Prorated from `fact_capacity.net_capacity_hours` (latest sync), Mon–Fri by week. */
  netCapacityHours: number
  /** Prorated from `fact_plans` (is_pto = false), latest sync. */
  plannedHours: number
  /** Remaining capacity (bench): prorated from `fact_bench.availability_hours`, latest sync. */
  availabilityHours: number
  /** From `fact_worklogs` where is_pto = true; sums through calendar month end (not the MTD worklog cap). */
  ptoHours: number
  billableHours: number
  loggedHours: number
}

export type WeeklyOverviewData = {
  monthLabel: string
  asOfDate: string | null
  /** Latest `sync_snapshot.id` used for snapshot facts (read-only). */
  snapshotId: string | null
  /** `sync_snapshot.created_at` for the row above (ingestion freshness). */
  syncCreatedAt: string | null
  weeks: WeeklyHeadline[]
  error: string | null
}

function weeksOverlappingMonth(monthStart: Date, monthEnd: Date): string[] {
  const keys: string[] = []
  let w = startOfWeek(monthStart, { weekStartsOn: 1 })
  while (w <= monthEnd) {
    const weekEnd = addDays(w, 6)
    if (weekEnd >= monthStart && w <= monthEnd) {
      keys.push(format(w, 'yyyy-MM-dd'))
    }
    w = addDays(w, 7)
  }
  return keys
}

/**
 * Inclusive end date for worklogs: month end, last sync, and today (all calendar days, UTC-agnostic).
 */
function logThroughDate(
  monthEnd: Date,
  syncCreatedAt: string,
  now: Date
): string {
  const end = endOfMonth(monthEnd)
  const t = minDate([end, startOfDay(parseISO(syncCreatedAt)), startOfDay(now)])
  return format(t, 'yyyy-MM-dd')
}

type PagedResult<T> = { rows: T[]; error: string | null }

async function pagedQuery<T>(run: (from: number) => Promise<{ data: unknown; error: { message: string } | null }>): Promise<PagedResult<T>> {
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

export async function loadWeeklyOverview(
  referenceDate?: Date,
  now?: Date
): Promise<WeeklyOverviewData> {
  await connection()
  const _referenceDate = referenceDate ?? new Date()
  const _now = now ?? new Date()
  const monthStart = startOfMonth(_referenceDate)
  const monthEnd = endOfMonth(_referenceDate)
  const monthLabel = formatMonthLabel(monthStart)
  const monthStartStr = format(monthStart, 'yyyy-MM-dd')
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd')
  const weekKeys = weeksOverlappingMonth(monthStart, monthEnd)
  const weightByWeek = buildWeekdayWeightMap(weekKeys, monthStart, monthEnd, _referenceDate)

  const empty: WeeklyOverviewData = {
    monthLabel,
    asOfDate: null,
    snapshotId: null,
    syncCreatedAt: null,
    weeks: [],
    error: null,
  }

  try {
    const latest = await getLatestSyncSnapshot()
    if (!latest) {
      return {
        ...empty,
        error:
          'No sync_snapshot rows yet. Run the capacity-mcp ingestion sync, then refresh.',
      }
    }

    const logThroughStr = logThroughDate(monthEnd, latest.createdAt, _now)
    const snapshotId = latest.id
    const supabase = createServiceClientCached()

    const [capRes, planRes, benchRes, wlRes, ptoWlRes] = await Promise.all([
      pagedQuery<{ person_id: string; net_capacity_hours: number }>(async (from) =>
        supabase
          .from('fact_capacity')
          .select('person_id, net_capacity_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ person_id: string; planned_hours: number | null }>(async (from) =>
        supabase
          .from('fact_plans')
          .select('person_id, planned_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .eq('is_pto', false)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ availability_hours: number | null }>(async (from) =>
        supabase
          .from('fact_bench')
          .select('availability_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{
        log_date: string
        billable_seconds: number
        logged_seconds: number
      }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('log_date, billable_seconds, logged_seconds')
          .eq('is_pto', false)
          .gte('log_date', monthStartStr)
          .lte('log_date', logThroughStr)
          .order('log_date', { ascending: true })
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{
        log_date: string
        logged_seconds: number
      }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('log_date, logged_seconds')
          .eq('is_pto', true)
          .gte('log_date', monthStartStr)
          .lte('log_date', monthEndStr)
          .order('log_date', { ascending: true })
          .range(from, from + PAGE - 1)
      ),
    ])

    if (capRes.error) {
      return { ...empty, error: `Could not load fact_capacity: ${capRes.error}` }
    }
    if (planRes.error) {
      return { ...empty, error: `Could not load fact_plans: ${planRes.error}` }
    }
    if (benchRes.error) {
      return { ...empty, error: `Could not load fact_bench: ${benchRes.error}` }
    }
    if (wlRes.error) {
      return { ...empty, error: `Could not load worklogs: ${wlRes.error}` }
    }
    if (ptoWlRes.error) {
      return { ...empty, error: `Could not load PTO worklogs: ${ptoWlRes.error}` }
    }

    const byPerson = new Map<string, number>()
    for (const r of capRes.rows) {
      const h = Number(r.net_capacity_hours)
      byPerson.set(r.person_id, (byPerson.get(r.person_id) ?? 0) + h)
    }
    const totalNetCapacity = Array.from(byPerson.values()).reduce((a, b) => a + b, 0)

    const totalPlanned = planRes.rows.reduce(
      (s, r) => s + Number(r.planned_hours ?? 0),
      0
    )

    const totalAvailability = benchRes.rows.reduce(
      (s, r) => s + Number(r.availability_hours ?? 0),
      0
    )

    const byWeek = new Map<string, { billable: number; logged: number }>()
    const byWeekPto = new Map<string, number>()

    for (const row of wlRes.rows) {
      const logDate = parse(row.log_date, 'yyyy-MM-dd', _referenceDate)
      const wk = format(startOfWeek(logDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (!byWeek.has(wk)) byWeek.set(wk, { billable: 0, logged: 0 })
      const bucket = byWeek.get(wk)!
      bucket.billable += Number(row.billable_seconds) / 3600
      bucket.logged += Number(row.logged_seconds) / 3600
    }

    for (const row of ptoWlRes.rows) {
      const logDate = parse(row.log_date, 'yyyy-MM-dd', _referenceDate)
      const wk = format(startOfWeek(logDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      byWeekPto.set(wk, (byWeekPto.get(wk) ?? 0) + Number(row.logged_seconds) / 3600)
    }

    const weeks: WeeklyHeadline[] = weekKeys.map((wk) => {
      const w = weightByWeek.get(wk) ?? 0
      const b = byWeek.get(wk) ?? { billable: 0, logged: 0 }
      const weekStartD = parse(wk, 'yyyy-MM-dd', _referenceDate)
      return {
        weekLabel: `Week of ${format(weekStartD, 'MMM d')}`,
        weekStart: wk,
        netCapacityHours: roundH(totalNetCapacity * w),
        plannedHours: roundH(totalPlanned * w),
        availabilityHours: roundH(totalAvailability * w),
        ptoHours: roundH(byWeekPto.get(wk) ?? 0),
        billableHours: roundH(b.billable),
        loggedHours: roundH(b.logged),
      }
    })

    return {
      monthLabel,
      asOfDate: logThroughStr,
      snapshotId: latest.id,
      syncCreatedAt: latest.createdAt,
      weeks,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error loading overview.'
    return { ...empty, error: message }
  }
}
