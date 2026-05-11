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

/** Shared empty set for optional PTO / holiday lookups (never mutated). */
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

/**
 * Net elapsed weekdays for utilization: eligible Mon–Fri days in the window minus zone holidays
 * and minus this person's PTO weekdays (union without double-counting — a single pass).
 */
export function elapsedNetWeekdaysForPerson(args: {
  eligibleWeekdayDates: ReadonlySet<string>
  zoneHolidayDates: ReadonlySet<string>
  personPtoWeekdayDates: ReadonlySet<string>
}): number {
  const { eligibleWeekdayDates, zoneHolidayDates, personPtoWeekdayDates } = args
  let n = 0
  for (const d of eligibleWeekdayDates) {
    if (zoneHolidayDates.has(d)) continue
    if (personPtoWeekdayDates.has(d)) continue
    n++
  }
  return n
}
