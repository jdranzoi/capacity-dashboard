/** Hours vs ticket Original Estimate. Null when estimate is missing or zero. */
export function hoursVersusEstimatePct(
  loggedHours: number,
  estimateHours: number | null
): number | null {
  if (estimateHours == null || estimateHours <= 0) return null
  return (loggedHours / estimateHours) * 100
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600
}

export function momLoggedDeltaPct(
  thisMonthHours: number,
  lastMonthHours: number
): number | null {
  if (lastMonthHours <= 0) return null
  return ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100
}
