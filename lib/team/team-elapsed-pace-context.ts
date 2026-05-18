import { getISODay, parse } from 'date-fns'

import {
  elapsedNetWeekdaysForPerson,
  holidaysByZoneEligibleWeekdays,
  NO_WEEKDAY_DATES,
  weekdayDateStringsMonthThrough,
} from '@/lib/overview/elapsed-net-weekdays'

/**
 * Mon–Fri dates in the reference month from month start through `logThroughStr` (inclusive),
 * same window as `loadWeeklyOverview` utilization pace.
 */
export function teamEligibleWeekdayDates(
  monthReference: Date,
  logThroughStr: string
): Set<string> {
  const through = parse(logThroughStr, 'yyyy-MM-dd', monthReference)
  return weekdayDateStringsMonthThrough(monthReference, through)
}

export function teamHolidaysByZoneForEligible(
  holidayRows: readonly { zone_id: string; date: string }[],
  eligibleWeekdays: ReadonlySet<string>
): Map<string, Set<string>> {
  return holidaysByZoneEligibleWeekdays(holidayRows, eligibleWeekdays)
}

/**
 * Weekday PTO dates per person through `logThroughStr` only (not future PTO in the month).
 */
export function teamPtoWeekdayDatesThrough(
  ptoRows: readonly { person_id: string; log_date: string }[],
  logThroughStr: string,
  monthReference: Date
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const row of ptoRows) {
    if (row.log_date > logThroughStr) continue
    const d = parse(row.log_date, 'yyyy-MM-dd', monthReference)
    const iso = getISODay(d)
    if (iso < 1 || iso > 5) continue
    let set = map.get(row.person_id)
    if (!set) {
      set = new Set()
      map.set(row.person_id, set)
    }
    set.add(row.log_date)
  }
  return map
}

export function teamPersonElapsedNetWeekdays(args: {
  personId: string
  zoneId: string | null
  eligibleWeekdays: ReadonlySet<string>
  holidaysByZone: Map<string, Set<string>>
  ptoWeekdayByPerson: Map<string, Set<string>>
}): number {
  const zoneHolidayDates =
    args.zoneId != null
      ? args.holidaysByZone.get(args.zoneId) ?? NO_WEEKDAY_DATES
      : NO_WEEKDAY_DATES
  return elapsedNetWeekdaysForPerson({
    eligibleWeekdayDates: args.eligibleWeekdays,
    zoneHolidayDates,
    personPtoWeekdayDates: args.ptoWeekdayByPerson.get(args.personId) ?? NO_WEEKDAY_DATES,
  })
}
