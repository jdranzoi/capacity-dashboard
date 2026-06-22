/**
 * Single rounding policy for dashboard **display** statistics (hours, percentages,
 * and other headline numbers): nearest integer via `Math.round`.
 *
 * Prefer `fmtHoursKpi`, `fmtPct`, and `fmtHoursCell` from `lib/overview/overview-metrics.ts`
 * at the UI and loader display boundary. This module owns the rounding implementation.
 */
export function roundDisplayStat(n: number): number {
  return Math.round(n)
}

export function fmtPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return '—'
  const i = roundDisplayStat(n)
  return `${i.toLocaleString('en-US', { maximumFractionDigits: 0 })}%`
}
