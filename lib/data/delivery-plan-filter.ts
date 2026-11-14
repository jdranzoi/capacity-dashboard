/**
 * PostgREST `or` filter for `fact_plans` rows that count as **Planned** (D-029):
 * delivery plans only, excluding PTO (`plan_kind = 'pto'`, project HR) and PRE
 * reservations (`plan_kind = 'reserved'`).
 *
 * Rows written before the stage-1 sync have `plan_kind = null`; for those the
 * previous rule (`is_pto = false`) applies. Once `plan_kind` is backfilled and
 * NOT NULL, this becomes `plan_kind = 'delivery'`.
 *
 * Usage: `supabase.from('fact_plans').select(...).or(DELIVERY_PLAN_FILTER)`.
 */
export const DELIVERY_PLAN_FILTER =
  'plan_kind.eq.delivery,and(plan_kind.is.null,is_pto.eq.false)'
