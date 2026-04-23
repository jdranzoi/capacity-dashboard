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

/** Weekdays (Mon–Fri) in [start, end] inclusive. */
export function countWeekdaysInclusive(start: Date, end: Date): number {
  if (start > end) return 0
  return eachDayOfInterval({ start, end }).filter((d) => {
    const iso = getISODay(d)
    return iso >= 1 && iso <= 5
  }).length
}

export function formatMonthLabel(d: Date): string {
  return format(d, 'MMMM yyyy')
}

/** Mon–Fri count for the full calendar month of `d`. (Holiday-adjusted day counts are Stage 2 / C-003.) */
export function countWeekdaysInMonthForDate(d: Date): number {
  return countWeekdaysInclusive(startOfMonth(d), endOfMonth(d))
}

/**
 * C-005 — working days from the first of the month through `through` (inclusive, capped to that month).
 * Uses Mon–Fri only; `dim_holiday` and zone-based calendars can extend this in Stage 2.
 */
export function countWeekdaysFromMonthStartThrough(through: Date, month: Date): number {
  const first = startOfMonth(month)
  const last = endOfMonth(month)
  const cap = startOfDay(minDate([maxDate([through, first]), last]))
  if (cap < first) return 0
  return countWeekdaysInclusive(first, cap)
}
