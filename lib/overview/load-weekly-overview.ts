import {
  filterHolidaysThrough,
  filterRowsByPerson,
  filterWorklogsThrough,
  getMonthFactBundle,
} from '@/lib/data/load-month-fact-bundle'
import { resolveSnapshotForMonth } from '@/lib/overview/overview-month-options'
import { overviewLogThroughDate } from '@/lib/overview/worklog-through-date'
import { buildWeekdayWeightMap } from '@/lib/overview/prorate-to-weeks'
import {
  addDays,
  endOfMonth,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { loggedUtilizationPct, STANDARD_WORKDAY_HOURS } from '@/lib/domain/workload-metrics'
import { roundDisplayStat } from '@/lib/format/display-stats'
import {
  elapsedNetWeekdaysForPerson,
  holidaysByZoneEligibleWeekdays,
  NO_PTO_HOURS,
  NO_WEEKDAY_DATES,
  ptoHoursByPersonDateThrough,
  employedSpanByPerson,
  WHOLE_MONTH,
  weekdayDateStringsMonthThrough,
} from '@/lib/overview/elapsed-net-weekdays'
import { formatMonthLabel } from './working-days'

export type WeeklyHeadline = {
  weekLabel: string
  weekStart: string
  /** Prorated from `fact_capacity.net_capacity_hours` (latest sync), Mon–Fri by week. */
  netCapacityHours: number
  /** Prorated from delivery `fact_plans` (no PTO, no PRE reservations), latest sync. */
  plannedHours: number
  /** PTO hours whose date falls in the week: logged before the sync day, planned from it on. */
  ptoHours: number
  billableHours: number
  loggedHours: number
}

export type OrgMonthRollupHours = {
  /** Sum of `fact_capacity.net_capacity_hours` across people (adds duplicate `source` rows per person). */
  netCapacityHours: number
  /**
   * MTD capacity budget: sum of elapsed net weekdays × 8h (same window as Utilization pace).
   * At month end this converges on `netCapacityHours` when people work standard 8h days.
   */
  elapsedCapacityHours: number
  /** Delivery `fact_plans` hours for org (no PTO, no PRE reservations). */
  plannedHours: number
  /** Non-PTO worklogs summed through overview MTD cap (`asOf`). */
  loggedHoursMtd: number
  /** Billable slice of non-PTO worklogs through same cap. */
  billableHoursMtd: number
  /** Full-month PTO hours; equals the sum of `fact_capacity.pto_hours`. */
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
   * PTO for the full month).
   */
  orgMonthRollupHours: OrgMonthRollupHours | null
  /**
   * **Utilization** — `loggedUtilizationPct(loggedHoursMtd, elapsedCapacityHours)`, a ratio of
   * sums over the KPI population. Elapsed net weekdays per person = Mon–Fri from month start through
   * `asOf`, minus `dim_holiday` dates for the person's zone, minus PTO hours / 8 in that window.
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
  /** When set, use this sync anchor; otherwise resolves via `v_dashboard_month_options` for the reference month. */
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
    const resolved = snapshot ?? (await resolveSnapshotForMonth(monthStartStr))
    if (!resolved) {
      return {
        ...empty,
        error:
          'No sync snapshot for this month. Run the capacity-mcp ingestion sync, then refresh.',
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
        elapsedCapacityHours: 0,
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
    const ptoRows = filterRowsByPerson(bundle.ptoDays, personIdFilter)
    const holidayRows = filterHolidaysThrough(bundle.holidays, logThroughStr)

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

    const ptoHoursByPersonDate = ptoHoursByPersonDateThrough(ptoRows, logThroughStr)

    const capacityPersonIds = new Set(capRows.map((r) => r.person_id))

    const personZoneById = new Map(capRows.map((r) => [r.person_id, r.zone_id]))
    const employedSpans = employedSpanByPerson(capRows)

    let elapsedCapacityHoursRaw = 0
    for (const pid of capacityPersonIds) {
      const zoneId = personZoneById.get(pid) ?? null
      const zoneHolidayDates =
        zoneId != null ? holidaysByZone.get(zoneId) ?? NO_WEEKDAY_DATES : NO_WEEKDAY_DATES
      const elapsed = elapsedNetWeekdaysForPerson({
        eligibleWeekdayDates: eligibleWeekdaysThroughAsOf,
        zoneHolidayDates,
        personPtoHoursByDate: ptoHoursByPersonDate.get(pid) ?? NO_PTO_HOURS,
        employedSpan: employedSpans.get(pid) ?? WHOLE_MONTH,
      })
      elapsedCapacityHoursRaw += elapsed * STANDARD_WORKDAY_HOURS
    }

    const loggedHoursOrgTotal = Array.from(loggedHoursByPerson.values()).reduce((a, b) => a + b, 0)
    const utilizationPct = loggedUtilizationPct(loggedHoursOrgTotal, elapsedCapacityHoursRaw)
    const billableHoursOrgTotal = wlRows.reduce(
      (s, row) => s + Number(row.billable_seconds) / 3600,
      0
    )
    const ptoHoursOrgTotal = ptoRows.reduce((s, row) => s + row.hours, 0)

    const orgMonthRollupHours: OrgMonthRollupHours = {
      netCapacityHours: roundDisplayStat(totalNetCapacity),
      elapsedCapacityHours: roundDisplayStat(elapsedCapacityHoursRaw),
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
      const ptoDate = parse(row.date, 'yyyy-MM-dd', _referenceDate)
      const wk = format(startOfWeek(ptoDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      byWeekPto.set(wk, (byWeekPto.get(wk) ?? 0) + row.hours)
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
