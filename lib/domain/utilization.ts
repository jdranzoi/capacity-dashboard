// C-005 — Utilization formula. Must match capacity/SKILL.md exactly.
// If this formula changes, update capacity/doc/CONTRACTS.md and DECISIONS.md first.
//
// v2 sources: `fact_capacity.net_capacity_hours` (latest `snapshot_id` from `sync_snapshot` for that
// person + month) for monthly target; `daysElapsed` / `totalWorkingDays` from the zone + holiday
// calendar (see `dim_holiday`, `dim_date`, and lib/overview/working-days.ts) when rolling up in Stage 2.

/**
 * Time-adjusted billable utilization.
 * Used for mid-month snapshots to avoid comparing partial actuals to a full-month target.
 *
 * @param billableHours   - Billable hours logged so far (is_billable = true, excluding internal)
 * @param monthlyTargetHours - Full-month net capacity (v2: `fact_capacity.net_capacity_hours`)
 * @param daysElapsed     - Working days elapsed in the month
 * @param totalWorkingDays - Total working days in the month
 * @returns Utilization as a decimal (e.g. 0.71 = 71%)
 */
export function timeAdjustedUtilization(
  billableHours: number,
  monthlyTargetHours: number,
  daysElapsed: number,
  totalWorkingDays: number
): number {
  const denominator = monthlyTargetHours * (daysElapsed / totalWorkingDays)
  if (denominator === 0) return 0
  return billableHours / denominator
}

/**
 * Full-month utilization (when actuals cover the full period).
 */
export function fullMonthUtilization(
  billableHours: number,
  monthlyTargetHours: number
): number {
  if (monthlyTargetHours === 0) return 0
  return billableHours / monthlyTargetHours
}
