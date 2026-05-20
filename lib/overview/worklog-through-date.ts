import {
  endOfMonth,
  format,
  min as minDate,
  parseISO,
  startOfDay,
} from 'date-fns'

/**
 * Inclusive end date for non-PTO worklogs: month end, last sync, and today (UTC-agnostic calendar days).
 * Overview and team MTD metrics apply this at read time; raw fact bundles store through calendar month end.
 */
export function overviewLogThroughDate(
  monthEnd: Date,
  syncCreatedAt: string,
  now: Date
): string {
  const end = endOfMonth(monthEnd)
  const t = minDate([end, startOfDay(parseISO(syncCreatedAt)), startOfDay(now)])
  return format(t, 'yyyy-MM-dd')
}
