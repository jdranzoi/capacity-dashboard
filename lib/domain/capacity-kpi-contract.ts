/**
 * Canonical Capacity KPI labels and formula footnotes.
 *
 * Org-level percentage KPIs (do not conflate with C-005 billable utilization):
 *
 * - **Capacity fill** — logged / net capacity (org hour roll-up)
 * - **Utilization** — logged / elapsed capacity (org hour roll-up)
 * - **Planned** — planned / net capacity (org hour roll-up)
 * - **Commercial utilization** — commercial logged / elapsed capacity (org hour roll-up)
 *
 * All ratios are ratios of sums over the people in scope (D-032).
 *
 * Implement formulas in `lib/domain/workload-metrics.ts`. UI must import labels from here.
 */

export const CAPACITY_FILL_KPI = {
  label: 'Capacity fill',
  formulaFootnote: 'Logged / net capacity',
} as const

export const UTILIZATION_KPI = {
  label: 'Utilization',
  formulaFootnote: 'Logged / elapsed capacity',
} as const

export const PLANNED_KPI = {
  label: 'Planned',
  formulaFootnote: 'Planned / net capacity',
} as const

export const COMMERCIAL_UTILIZATION_KPI = {
  label: 'Commercial utilization',
  formulaFootnote: 'Commercial hours / elapsed capacity',
} as const
