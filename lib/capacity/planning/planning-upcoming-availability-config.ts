/**
 * Upcoming Availability sidebar — who counts as staffing headroom per month.
 * Uses planned utilization (plan ÷ net capacity), not open hours.
 */
export type PlanningUpcomingUtilThreshold = 'lt40' | 'lt60' | 'lt80'

export const PLANNING_UPCOMING_UTIL_THRESHOLDS: PlanningUpcomingUtilThreshold[] = [
  'lt40',
  'lt60',
  'lt80',
]

export const PLANNING_UPCOMING_UTIL_THRESHOLD_PCT: Record<
  PlanningUpcomingUtilThreshold,
  number
> = {
  lt40: 40,
  lt60: 60,
  lt80: 80,
}

/** Default threshold — matches the people grid `<60` band. */
export const PLANNING_UPCOMING_DEFAULT_UTIL_THRESHOLD: PlanningUpcomingUtilThreshold = 'lt60'

/** @deprecated Use `PLANNING_UPCOMING_UTIL_THRESHOLD_PCT.lt60` */
export const PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT =
  PLANNING_UPCOMING_UTIL_THRESHOLD_PCT.lt60

export function planningUpcomingUtilThresholdPct(
  threshold: PlanningUpcomingUtilThreshold
): number {
  return PLANNING_UPCOMING_UTIL_THRESHOLD_PCT[threshold]
}
