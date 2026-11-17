/**
 * PostgREST `or` filters for delivery `fact_plans` rows (D-029, D-035). Both exclude PTO
 * (`plan_kind = 'pto'`, project HR) and PRE reservations (`plan_kind = 'reserved'`).
 *
 * Rows written before the stage-1 sync have `plan_kind = null`; for those the previous
 * rule (`is_pto = false`) applies. Those syncs only wrote the capacity population.
 *
 * Usage: `supabase.from('fact_plans').select(...).or(DELIVERY_PLAN_FILTER)`.
 */

/**
 * **Planned** for capacity KPIs: delivery plans of the month's capacity population
 * (`in_population`). Contractor plans never count.
 */
export const DELIVERY_PLAN_FILTER =
  'and(plan_kind.eq.delivery,in_population.is.true),and(plan_kind.is.null,is_pto.eq.false)'

/**
 * Delivery plans of everyone planned on a project, contractors included. For project-level
 * views, which also count contractor worklogs; never for capacity KPIs.
 */
export const PROJECT_DELIVERY_PLAN_FILTER =
  'plan_kind.eq.delivery,and(plan_kind.is.null,is_pto.eq.false)'
