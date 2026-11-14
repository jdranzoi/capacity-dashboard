import { parse } from 'date-fns'

import {
  elapsedNetWeekdaysForPerson,
  holidaysByZoneEligibleWeekdays,
  NO_PTO_HOURS,
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

export function teamPersonElapsedNetWeekdays(args: {
  personId: string
  zoneId: string | null
  eligibleWeekdays: ReadonlySet<string>
  holidaysByZone: Map<string, Set<string>>
  ptoHoursByPersonDate: Map<string, Map<string, number>>
}): number {
  const zoneHolidayDates =
    args.zoneId != null
      ? args.holidaysByZone.get(args.zoneId) ?? NO_WEEKDAY_DATES
      : NO_WEEKDAY_DATES
  return elapsedNetWeekdaysForPerson({
    eligibleWeekdayDates: args.eligibleWeekdays,
    zoneHolidayDates,
    personPtoHoursByDate: args.ptoHoursByPersonDate.get(args.personId) ?? NO_PTO_HOURS,
  })
}
