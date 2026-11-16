import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  max as maxDate,
  min as minDate,
  startOfDay,
  startOfMonth,
} from 'date-fns'

import { STANDARD_WORKDAY_HOURS } from '@/lib/domain/workload-metrics'

/** Shared empty set for optional holiday lookups (never mutated). */
export const NO_WEEKDAY_DATES: ReadonlySet<string> = new Set<string>()

/**
 * Mon–Fri calendar dates (`yyyy-MM-dd`) from the start of `monthRef`'s month through `through`,
 * inclusive, capped to that month (same window as `countWeekdaysFromMonthStartThrough`).
 */
export function weekdayDateStringsMonthThrough(monthRef: Date, through: Date): Set<string> {
  const first = startOfMonth(monthRef)
  const last = endOfMonth(monthRef)
  const cap = startOfDay(minDate([maxDate([through, first]), last]))
  const dates = new Set<string>()
  for (const d of eachDayOfInterval({ start: first, end: cap })) {
    const iso = getISODay(d)
    if (iso >= 1 && iso <= 5) dates.add(format(d, 'yyyy-MM-dd'))
  }
  return dates
}

/**
 * Group `dim_holiday` rows into weekday dates per zone (Mon–Fri only, intersecting `eligibleWeekdays`).
 */
export function holidaysByZoneEligibleWeekdays(
  rows: readonly { zone_id: string; date: string }[],
  eligibleWeekdays: ReadonlySet<string>
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const { zone_id, date } of rows) {
    if (!eligibleWeekdays.has(date)) continue
    let set = map.get(zone_id)
    if (!set) {
      set = new Set()
      map.set(zone_id, set)
    }
    set.add(date)
  }
  return map
}

/** Shared empty PTO lookup (never mutated). */
export const NO_PTO_HOURS: ReadonlyMap<string, number> = new Map<string, number>()

/**
 * PTO hours per person and date from `MonthFactBundle.ptoDays`, through `logThroughStr`
 * (inclusive). Later days in the month do not reduce elapsed capacity.
 */
export function ptoHoursByPersonDateThrough(
  ptoDays: readonly { person_id: string; date: string; hours: number }[],
  logThroughStr: string
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>()
  for (const row of ptoDays) {
    if (row.date > logThroughStr) continue
    let byDate = map.get(row.person_id)
    if (!byDate) {
      byDate = new Map()
      map.set(row.person_id, byDate)
    }
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.hours)
  }
  return map
}

/**
 * Days of the month a person was employed (D-034), from `fact_capacity.employed_from` /
 * `employed_through`. Null bounds mean month start / month end.
 */
export type EmployedSpan = { from: string | null; through: string | null }

export const WHOLE_MONTH: EmployedSpan = { from: null, through: null }

export function employedSpanByPerson(
  capRows: readonly { person_id: string; employed_from: string | null; employed_through: string | null }[]
): Map<string, EmployedSpan> {
  return new Map(
    capRows.map((r) => [r.person_id, { from: r.employed_from, through: r.employed_through }])
  )
}

/**
 * Net elapsed weekdays for utilization (D-032, D-034): eligible Mon–Fri days in the window
 * inside the person's employed span, minus zone holidays, minus PTO hours / 8 (a half-day
 * of PTO removes half a day).
 */
export function elapsedNetWeekdaysForPerson(args: {
  eligibleWeekdayDates: ReadonlySet<string>
  zoneHolidayDates: ReadonlySet<string>
  personPtoHoursByDate: ReadonlyMap<string, number>
  employedSpan: EmployedSpan
}): number {
  const { eligibleWeekdayDates, zoneHolidayDates, personPtoHoursByDate, employedSpan } = args
  let n = 0
  for (const d of eligibleWeekdayDates) {
    if (employedSpan.from != null && d < employedSpan.from) continue
    if (employedSpan.through != null && d > employedSpan.through) continue
    if (zoneHolidayDates.has(d)) continue
    const pto = Math.min(STANDARD_WORKDAY_HOURS, personPtoHoursByDate.get(d) ?? 0)
    n += 1 - pto / STANDARD_WORKDAY_HOURS
  }
  return n
}
