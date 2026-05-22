/**
 * Canonical Capacity KPI labels and formula footnotes.
 *
 * Three org-level percentage KPIs (do not conflate with C-005 billable utilization):
 *
 * - **Capacity fill** — logged / net capacity (org hour roll-up)
 * - **Utilization** — mean per-person pace: logged / (net elapsed working days × 8h)
 * - **Planned** — planned / net capacity (org hour roll-up)
 *
 * Implement formulas in `lib/domain/workload-metrics.ts`. UI must import labels from here.
 */

export const CAPACITY_FILL_KPI = {
  label: 'Capacity fill',
  formulaFootnote: 'Logged / net capacity',
} as const

export const UTILIZATION_KPI = {
  label: 'Utilization',
  formulaFootnote:
    'Logged / net elapsed working days (× 8h per person, org average)',
} as const

export const PLANNED_KPI = {
  label: 'Planned',
  formulaFootnote: 'Planned / net capacity',
} as const
