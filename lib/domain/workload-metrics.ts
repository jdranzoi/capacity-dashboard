/**
 * Central definitions for workload KPIs (capacity fill, utilization, planned share,
 * productivity, efficiency, weekly table roll-ups).
 *
 * **Standard org percentage KPIs** (see `lib/domain/capacity-kpi-contract.ts` for labels):
 *
 * | KPI | Formula | Primary function |
 * |-----|---------|------------------|
 * | Capacity fill | logged / net capacity | {@link capacityFillPct} |
 * | Utilization | logged / elapsed capacity | {@link loggedUtilizationPct} |
 * | Planned | planned / net capacity | {@link plannedPct} |
 * | Commercial utilization | commercial logged / elapsed capacity | {@link commercialUtilizationPct} |
 *
 * Every ratio aggregates as a **ratio of sums** over the people in scope (D-032): sum the
 * numerator and the denominator first, then divide. Never average per-person percentages.
 *
 * UI layers must not embed these formulas — import from here so period / role / person rollups
 * stay consistent when definitions change.
 */

import { roundDisplayStat } from '@/lib/format/display-stats'

/** Standard day length used for logged utilization vs elapsed net working days (dashboard convention). */
export const STANDARD_WORKDAY_HOURS = 8 as const

/**
 * **Utilization** (D-032): logged hours vs elapsed capacity, as a ratio of sums.
 *
 * Elapsed capacity = elapsed net weekdays × 8h, where elapsed net weekdays are the weekdays of the
 * month through the worklog as-of date minus zone holidays minus PTO hours / 8
 * (`elapsedNetWeekdaysForPerson` in `lib/overview/elapsed-net-weekdays.ts`). Sum logged and elapsed
 * capacity over the people (and months) in scope before calling this — the same function serves a
 * person row, a role, the org and a multi-month range.
 *
 * Example: logged 120 + 30 over elapsed 160 + 40 → 150 / 200 = 75%.
 *
 * **Return value** is rounded to the nearest integer (`roundDisplayStat`).
 * Null when elapsed capacity is non-positive or logged is negative.
 */
export function loggedUtilizationPct(
  loggedHours: number,
  elapsedCapacityHours: number
): number | null {
  if (
    !(elapsedCapacityHours > 0) ||
    !(loggedHours >= 0)
  ) {
    return null
  }
  return roundDisplayStat((loggedHours / elapsedCapacityHours) * 100)
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
 * **Capacity fill** (org roll-up): logged vs prorated org net capacity for an ISO week or month.
 *
 * Billable is **not** capacity fill — use {@link billableVersusLoggedEfficiencyPct} for billable vs logged.
 * Denominator is org net capacity from snapshot facts (weekly cells use Mon–Fri overlap weights in `prorate-to-weeks`).
 *
 * MTD column must use summed logged / summed net capacity — not the average of weekly percentages.
 *
 * UI shows "—" when logged or net capacity for that cell is non-positive (aligned with zero logged as empty hours).
 *
 * **Return value** is rounded to the nearest integer for display consistency (`roundDisplayStat`).
 *
 * @see CLAUDE.md — Overview weekly metrics
 */
export function capacityFillPct(
  loggedHours: number,
  netCapacityHours: number
): number | null {
  if (loggedHours <= 0 || netCapacityHours <= 0) return null
  return roundDisplayStat((loggedHours / netCapacityHours) * 100)
}

/**
 * **Commercial utilization** (org roll-up): commercial logged hours vs elapsed capacity.
 *
 * Uses `fact_worklogs.is_commercial` (stamped at sync), not Tempo billable.
 * Denominator is elapsed capacity (same MTD window as {@link loggedUtilizationPct}).
 * Null when commercial hours or elapsed capacity are non-positive.
 *
 * **Return value** is rounded to the nearest integer (`roundDisplayStat`).
 */
export function commercialUtilizationPct(
  commercialHours: number,
  elapsedCapacityHours: number
): number | null {
  return capacityFillPct(commercialHours, elapsedCapacityHours)
}

/**
 * **Planned** (org roll-up): planned hours vs monthly net capacity (%). Null when net capacity ≤ 0.
 */
export function plannedPct(plannedHours: number, netCapacityHours: number): number | null {
  if (netCapacityHours <= 0 || plannedHours < 0) return null
  return roundDisplayStat((plannedHours / netCapacityHours) * 100)
}
