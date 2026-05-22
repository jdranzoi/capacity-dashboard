import {
  filterHolidaysThrough,
  filterRowsByPerson,
  filterWorklogsThrough,
  getMonthFactBundle,
} from '@/lib/data/load-month-fact-bundle'
import { getLatestSyncSnapshot } from '@/lib/data/latest-sync-snapshot'
import { createServiceClientCached } from '@/lib/supabase/server'
import { overviewLogThroughDate } from '@/lib/overview/worklog-through-date'
import { buildWeekdayWeightMap } from '@/lib/overview/prorate-to-weeks'
import {
  addDays,
  endOfMonth,
  format,
  getISODay,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  meanPersonLoggedUtilizationPct,
  personLoggedUtilizationPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'
import { roundDisplayStat } from '@/lib/format/display-stats'
import {
  elapsedNetWeekdaysForPerson,
  holidaysByZoneEligibleWeekdays,
  NO_WEEKDAY_DATES,
  weekdayDateStringsMonthThrough,
} from '@/lib/overview/elapsed-net-weekdays'
import { formatMonthLabel } from './working-days'

export type WeeklyHeadline = {
  weekLabel: string
  weekStart: string
  /** Prorated from `fact_capacity.net_capacity_hours` (latest sync), Mon–Fri by week. */
  netCapacityHours: number
  /** Prorated from `fact_plans` (is_pto = false), latest sync. */
  plannedHours: number
  /** From `fact_worklogs` where is_pto = true; sums through calendar month end (not the MTD worklog cap). */
  ptoHours: number
  billableHours: number
  loggedHours: number
}

export type OrgMonthRollupHours = {
  /** Sum of `fact_capacity.net_capacity_hours` across people (adds duplicate `source` rows per person). */
  netCapacityHours: number
  /** Non-PTO `fact_plans` hours for org. */
  plannedHours: number
  /** Non-PTO worklogs summed through overview MTD cap (`asOf`). */
  loggedHoursMtd: number
  /** Billable slice of non-PTO worklogs through same cap. */
  billableHoursMtd: number
  /** PTO hours through calendar month end (no MTD/sync clamp per overview contract). */
  ptoHoursMonth: number
}

export type WeeklyOverviewData = {
  monthLabel: string
  asOfDate: string | null
  /** Latest `sync_snapshot.id` used for snapshot facts (read-only). */
  snapshotId: string | null
  /** `sync_snapshot.created_at` for the row above (ingestion freshness). */
  syncCreatedAt: string | null
  /**
   * Org-level sums for headline KPIs — same ingestion rules as overview weekly cards
   * (capacity/planned = full month snapshot facts; logged/billable = MTD `asOfDate`;
   * PTO through calendar month end).
   */
  orgMonthRollupHours: OrgMonthRollupHours | null
  /**
   * **Utilization** — mean of per-person pace (`meanPersonLoggedUtilizationPct` over samples from
   * `personLoggedUtilizationPct` in `lib/domain/workload-metrics.ts`).
   * Elapsed net weekdays = Mon–Fri from month start through `asOf`, minus `dim_holiday` dates for the
   * person's `dim_person.zone_id` in that window (weekdays only), minus distinct weekday PTO dates from
   * `fact_worklogs` (`is_pto`, capped by the same `asOf` as non-PTO logs).
   */
  utilizationPct: number | null
  /**
   * Distinct `person_id` in `fact_capacity` for the reference month (after optional person filter).
   * Same people scope as org capacity / planned / bench rollups.
   */
  capacityHeadcount: number
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

export async function loadWeeklyOverview(
  referenceDate?: Date,
  now?: Date,
  /** When set, use this sync anchor instead of the global latest `sync_snapshot`. */
  snapshot?: { id: string; createdAt: string },
  /**
   * Restrict headline rollups and weekly rows to these people (must be a subset of
   * `fact_capacity` rows for the month). `null` / `undefined` = full org.
   * An empty set means no matching people — zeroed metrics with the same week spine.
   */
  personIdFilter?: Set<string> | null
): Promise<WeeklyOverviewData> {
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
    orgMonthRollupHours: null,
    utilizationPct: null,
    capacityHeadcount: 0,
    weeks: [],
    error: null,
  }

  try {
    const resolved = snapshot ?? (await getLatestSyncSnapshot())
    if (!resolved) {
      return {
        ...empty,
        error:
          'No sync_snapshot rows yet. Run the capacity-mcp ingestion sync, then refresh.',
      }
    }

    const logThroughStr = overviewLogThroughDate(monthEnd, resolved.createdAt, _now)
    const logThroughD = parse(logThroughStr, 'yyyy-MM-dd', _referenceDate)
    const snapshotId = resolved.id

    if (personIdFilter && personIdFilter.size === 0) {
      const weeksZeroed: WeeklyHeadline[] = weekKeys.map((wk) => {
        const weekStartD = parse(wk, 'yyyy-MM-dd', _referenceDate)
        return {
          weekLabel: `Week of ${format(weekStartD, 'MMM d')}`,
          weekStart: wk,
          netCapacityHours: 0,
          plannedHours: 0,
          ptoHours: 0,
          billableHours: 0,
          loggedHours: 0,
        }
      })
      const zeros: OrgMonthRollupHours = {
        netCapacityHours: 0,
        plannedHours: 0,
        loggedHoursMtd: 0,
        billableHoursMtd: 0,
        ptoHoursMonth: 0,
      }
      return {
        monthLabel,
        asOfDate: logThroughStr,
        snapshotId: resolved.id,
        syncCreatedAt: resolved.createdAt,
        orgMonthRollupHours: zeros,
        utilizationPct: null,
        capacityHeadcount: 0,
        weeks: weeksZeroed,
        error: null,
      }
    }

    const bundleResult = await getMonthFactBundle(snapshotId, monthStartStr, monthEndStr)
    if (bundleResult.error || !bundleResult.data) {
      return {
        ...empty,
        error: bundleResult.error
          ? `Could not load month facts: ${bundleResult.error}`
          : 'Could not load month facts (unexpected).',
      }
    }

    const bundle = bundleResult.data
    const capRows = filterRowsByPerson(bundle.capacity, personIdFilter)
    const planRows = filterRowsByPerson(bundle.plans, personIdFilter)
    const wlRows = filterWorklogsThrough(
      filterRowsByPerson(bundle.worklogs, personIdFilter),
      logThroughStr
    )
    const ptoRows = filterRowsByPerson(bundle.ptoWorklogs, personIdFilter)
    const holidayRows = filterHolidaysThrough(bundle.holidays, logThroughStr)

    const supabase = createServiceClientCached()

    const byPerson = new Map<string, number>()
    for (const r of capRows) {
      const h = Number(r.net_capacity_hours)
      byPerson.set(r.person_id, (byPerson.get(r.person_id) ?? 0) + h)
    }
    const totalNetCapacity = Array.from(byPerson.values()).reduce((a, b) => a + b, 0)

    const totalPlanned = planRows.reduce((s, r) => s + Number(r.planned_hours ?? 0), 0)

    const eligibleWeekdaysThroughAsOf = weekdayDateStringsMonthThrough(
      _referenceDate,
      logThroughD
    )
    const holidaysByZone = holidaysByZoneEligibleWeekdays(
      holidayRows,
      eligibleWeekdaysThroughAsOf
    )

    const loggedHoursByPerson = new Map<string, number>()
    for (const row of wlRows) {
      const pid = row.person_id
      const h = Number(row.logged_seconds) / 3600
      loggedHoursByPerson.set(pid, (loggedHoursByPerson.get(pid) ?? 0) + h)
    }

    const ptoWeekdayDatesByPerson = new Map<string, Set<string>>()
    for (const row of ptoRows) {
      if (row.log_date > logThroughStr) continue
      const d = parse(row.log_date, 'yyyy-MM-dd', _referenceDate)
      const iso = getISODay(d)
      if (iso < 1 || iso > 5) continue
      const pid = row.person_id
      let set = ptoWeekdayDatesByPerson.get(pid)
      if (!set) {
        set = new Set()
        ptoWeekdayDatesByPerson.set(pid, set)
      }
      set.add(row.log_date)
    }

    const capacityPersonIds = new Set(capRows.map((r) => r.person_id))

    const personZoneById = new Map<string, string | null>()
    const personIdList = Array.from(capacityPersonIds)
    const ZONE_BATCH = 200
    for (let i = 0; i < personIdList.length; i += ZONE_BATCH) {
      const slice = personIdList.slice(i, i + ZONE_BATCH)
      const { data: peopleRows, error: zoneErr } = await supabase
        .from('dim_person')
        .select('id, zone_id')
        .in('id', slice)
      if (zoneErr) {
        return { ...empty, error: `Could not load dim_person (zones): ${zoneErr.message}` }
      }
      for (const row of peopleRows ?? []) {
        personZoneById.set(row.id, row.zone_id)
      }
    }

    const utilizationSamples: number[] = []
    for (const pid of capacityPersonIds) {
      const zoneId = personZoneById.get(pid) ?? null
      const zoneHolidayDates =
        zoneId != null ? holidaysByZone.get(zoneId) ?? NO_WEEKDAY_DATES : NO_WEEKDAY_DATES
      const elapsed = elapsedNetWeekdaysForPerson({
        eligibleWeekdayDates: eligibleWeekdaysThroughAsOf,
        zoneHolidayDates,
        personPtoWeekdayDates: ptoWeekdayDatesByPerson.get(pid) ?? NO_WEEKDAY_DATES,
      })
      const logged = loggedHoursByPerson.get(pid) ?? 0
      const pct = personLoggedUtilizationPct(logged, elapsed, STANDARD_WORKDAY_HOURS)
      if (pct !== null) utilizationSamples.push(pct)
    }
    const utilizationPct =
      utilizationSamples.length > 0
        ? roundDisplayStat(meanPersonLoggedUtilizationPct(utilizationSamples)!)
        : null

    const loggedHoursOrgTotal = Array.from(loggedHoursByPerson.values()).reduce((a, b) => a + b, 0)
    const billableHoursOrgTotal = wlRows.reduce(
      (s, row) => s + Number(row.billable_seconds) / 3600,
      0
    )
    const ptoHoursOrgTotal = ptoRows.reduce(
      (s, row) => s + Number(row.logged_seconds) / 3600,
      0
    )

    const orgMonthRollupHours: OrgMonthRollupHours = {
      netCapacityHours: roundDisplayStat(totalNetCapacity),
      plannedHours: roundDisplayStat(totalPlanned),
      loggedHoursMtd: roundDisplayStat(loggedHoursOrgTotal),
      billableHoursMtd: roundDisplayStat(billableHoursOrgTotal),
      ptoHoursMonth: roundDisplayStat(ptoHoursOrgTotal),
    }

    const byWeek = new Map<string, { billable: number; logged: number }>()
    const byWeekPto = new Map<string, number>()

    for (const row of wlRows) {
      const logDate = parse(row.log_date, 'yyyy-MM-dd', _referenceDate)
      const wk = format(startOfWeek(logDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (!byWeek.has(wk)) byWeek.set(wk, { billable: 0, logged: 0 })
      const bucket = byWeek.get(wk)!
      bucket.billable += Number(row.billable_seconds) / 3600
      bucket.logged += Number(row.logged_seconds) / 3600
    }

    for (const row of ptoRows) {
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
        netCapacityHours: roundDisplayStat(totalNetCapacity * w),
        plannedHours: roundDisplayStat(totalPlanned * w),
        ptoHours: roundDisplayStat(byWeekPto.get(wk) ?? 0),
        billableHours: roundDisplayStat(b.billable),
        loggedHours: roundDisplayStat(b.logged),
      }
    })

    return {
      monthLabel,
      asOfDate: logThroughStr,
      snapshotId: resolved.id,
      syncCreatedAt: resolved.createdAt,
      orgMonthRollupHours,
      utilizationPct,
      capacityHeadcount: roundDisplayStat(capacityPersonIds.size),
      weeks,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error loading overview.'
    return { ...empty, error: message }
  }
}
