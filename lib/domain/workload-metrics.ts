/**
 * Central definitions for overview workload KPIs (logged utilization, productivity, efficiency,
 * capacity-share donuts, weekly logged-vs-capacity table roll-up).
 *
 * UI layers must not embed these formulas — import from here so period / role / person rollups
 * stay consistent when definitions change.
 */

import { roundDisplayStat } from '@/lib/format/display-stats'

/** Standard day length used for logged utilization vs elapsed net working days (dashboard convention). */
export const STANDARD_WORKDAY_HOURS = 8 as const

/**
 * Arithmetic mean. Empty input → null.
 */
export function meanArithmetic(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Per-person logged utilization (%).
 *
 * Formula: `(loggedHours / elapsedWorkingDays / standardDayHours) * 100`
 *
 * Reference implementation for counting **`elapsedWorkingDays`**: `elapsedNetWeekdaysForPerson` in
 * `lib/overview/elapsed-net-weekdays.ts` (overview loader subtracts `dim_holiday` by `dim_person.zone_id`
 * and weekday PTO through `asOf`).
 *
 * Examples (standardDayHours = 8):
 * - logged 9, elapsed 3 → ((9/3)/8)*100 = 37.5
 * - logged 25, elapsed 5 → 62.5
 * - logged 34, elapsed 6 → 70.833…
 *
 * @returns null if `elapsedWorkingDays <= 0`, `standardDayHours <= 0`, or `loggedHours < 0`
 */
export function personLoggedUtilizationPct(
  loggedHours: number,
  elapsedWorkingDays: number,
  standardDayHours: number = STANDARD_WORKDAY_HOURS
): number | null {
  if (
    elapsedWorkingDays <= 0 ||
    standardDayHours <= 0 ||
    loggedHours < 0 ||
    Number.isNaN(loggedHours) ||
    Number.isNaN(elapsedWorkingDays)
  ) {
    return null
  }
  return (loggedHours / elapsedWorkingDays / standardDayHours) * 100
}

/**
 * Global average logged utilization: arithmetic mean of per-person percentages (e.g. roll-up
 * across people or roles). Each sample should already be a percentage from
 * {@link personLoggedUtilizationPct}.
 */
export function meanPersonLoggedUtilizationPct(samples: readonly number[]): number | null {
  return meanArithmetic(samples)
}

/**
 * Org-level ratio for donut / headline use: `part / whole * 100`, `0` when `whole <= 0`.
 */
export function hoursSharePercentage(part: number, whole: number): number {
  if (whole <= 0) return 0
  return (part / whole) * 100
}

/**
 * Productivity: logged hours vs planned hours (%).
 * Null when planned ≤ 0 (nothing to compare against).
 */
export function loggedVersusPlannedProductivityPct(
  loggedHours: number,
  plannedHours: number
): number | null {
  if (plannedHours <= 0) return null
  return (loggedHours / plannedHours) * 100
}

/**
 * Efficiency: billable vs logged hours (%).
 * Null when logged ≤ 0 (no denominator).
 */
export function billableVersusLoggedEfficiencyPct(
  billableHours: number,
  loggedHours: number
): number | null {
  if (loggedHours <= 0) return null
  return (billableHours / loggedHours) * 100
}

/**
 * Weekly-detail table utilization (org roll-up): **logged** vs prorated org net capacity for an ISO week.
 *
 * Billable is **not** utilization here — use {@link billableVersusLoggedEfficiencyPct} for billable vs logged.
 * Denominator is org net capacity for that week from snapshot facts × Mon–Fri overlap weights (`prorate-to-weeks`).
 *
 * MTD column must use summed logged / summed net capacity — not the average of weekly percentages.
 *
 * UI shows "—" when logged or net capacity for that cell is non-positive (aligned with zero logged as empty hours).
 *
 * **Return value** is rounded to the nearest integer for display consistency (`roundDisplayStat`).
 *
 * @see CLAUDE.md — Overview weekly metrics
 */
export function overviewWeeklyLoggedUtilizationPct(
  loggedHours: number,
  netCapacityHours: number
): number | null {
  if (loggedHours <= 0 || netCapacityHours <= 0) return null
  return roundDisplayStat((loggedHours / netCapacityHours) * 100)
}
