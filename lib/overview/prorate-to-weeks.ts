import { addDays, max as maxDate, min as minDate, parse, startOfDay } from 'date-fns'
import { countWeekdaysInclusive } from './working-days'

/**
 * Splits a calendar month (Mon–Fri only) into weight per ISO week (Monday start).
 * For each week key, weight = (weekdays in that week, clipped to the month) / (total weekdays in month).
 * Weights sum to 1. Used to spread monthly `fact_*` numbers across weekly cards.
 */
export function buildWeekdayWeightMap(
  weekStartKeys: string[],
  monthStart: Date,
  monthEnd: Date,
  reference: Date
): Map<string, number> {
  const total = countWeekdaysInclusive(monthStart, monthEnd)
  const m = new Map<string, number>()
  if (total === 0) {
    for (const wk of weekStartKeys) m.set(wk, 0)
    return m
  }
  for (const wk of weekStartKeys) {
    const wStart = parse(wk, 'yyyy-MM-dd', reference)
    const wEnd = addDays(wStart, 6)
    const segStart = startOfDay(maxDate([wStart, monthStart]))
    const segEnd = startOfDay(minDate([wEnd, monthEnd]))
    const n = countWeekdaysInclusive(segStart, segEnd)
    m.set(wk, n / total)
  }
  return m
}
