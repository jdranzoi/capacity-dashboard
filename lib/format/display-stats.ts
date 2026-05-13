/**
 * Single rounding policy for dashboard **display** statistics (hours, percentages,
 * and other headline numbers): nearest integer via `Math.round`.
 *
 * Prefer formatting through `fmtHoursKpi`, `fmtPct`, and `fmtHoursCell` in
 * `lib/overview/overview-metrics.ts` where applicable; use this for loaders that
 * normalize persisted payload fields to match what the UI shows, or for charts
 * when values must align with labels.
 */
export function roundDisplayStat(n: number): number {
  return Math.round(n)
}
