/**
 * Delivery-focused project metrics (planned vs logged, overrun, burn, risk).
 * UI and loaders must import from here — do not duplicate formulas in components.
 */

import { roundDisplayStat } from '@/lib/format/display-stats'

/** Budget-at-risk threshold: logged hours exceed budget by more than 15%. */
export const PROJECT_BUDGET_AT_RISK_PCT = 115

/**
 * Distinct people with non-zero logged hours (project worklogs in the queried period).
 */
export function countPeopleWhoLoggedHours(
  worklogRows: readonly { person_id: string; logged_seconds: number }[]
): number {
  const personIds = new Set<string>()
  for (const row of worklogRows) {
    if (Number(row.logged_seconds) > 0) {
      personIds.add(row.person_id)
    }
  }
  return personIds.size
}

/**
 * Distinct people with planned hours on a project in the reference month.
 */
export function countPeopleOnProjectPlan(
  planRows: readonly { person_id: string; project_id: string; planned_hours: number }[],
  projectId: string
): number {
  const personIds = new Set<string>()
  for (const row of planRows) {
    if (row.project_id !== projectId || row.planned_hours <= 0) continue
    personIds.add(row.person_id)
  }
  return personIds.size
}

/**
 * Budget used: logged / budget × 100 (rounded to nearest integer for display).
 * Returns null when budget ≤ 0 (nothing to compare against).
 */
export function projectBudgetUsedPct(
  loggedHours: number,
  budgetHours: number | null
): number | null {
  if (budgetHours == null || budgetHours <= 0 || loggedHours < 0) return null
  return roundDisplayStat((loggedHours / budgetHours) * 100)
}

/** Hours logged above plan (zero when under or on plan). */
export function projectOverrunHours(loggedHours: number, plannedHours: number): number {
  return roundDisplayStat(Math.max(0, loggedHours - plannedHours))
}

/**
 * Portfolio "at risk" — budget used exceeds budget by more than 15%
 * ({@link PROJECT_BUDGET_AT_RISK_PCT} display percent).
 */
export function isProjectAtBudgetRisk(budgetUsedPct: number | null): boolean {
  if (budgetUsedPct == null) return false
  return budgetUsedPct > PROJECT_BUDGET_AT_RISK_PCT
}

/**
 * Org burn rate (hours/month): total logged across the window divided by month count.
 * Used for the headline KPI from per-month actuals totals.
 */
export function orgBurnRateHoursPerMonth(
  monthlyLoggedTotals: readonly number[],
  monthCount: number
): number | null {
  if (monthCount <= 0 || monthlyLoggedTotals.length === 0) return null
  const sum = monthlyLoggedTotals.reduce((a, b) => a + b, 0)
  return roundDisplayStat(sum / monthCount)
}

/**
 * Per-project burn rate: average monthly logged over the supplied months.
 */
export function projectBurnRateHoursPerMonth(
  monthlyLoggedHours: readonly number[]
): number | null {
  if (monthlyLoggedHours.length === 0) return null
  const sum = monthlyLoggedHours.reduce((a, b) => a + b, 0)
  return roundDisplayStat(sum / monthlyLoggedHours.length)
}
