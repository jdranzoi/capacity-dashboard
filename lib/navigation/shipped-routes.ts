/**
 * Routes with a shipped dashboard (not a placeholder / coming-soon shell).
 *
 * Add an href when its sub-section track completes. Keep in sync with
 * docs/PROJECT_STATUS.md and section plans (e.g. SP2_CAPACITY_PLAN.md).
 */
export const SHIPPED_NAV_HREFS = new Set<string>([
  '/',
  '/ask',
  '/capacity/overview',
  '/capacity/utilization',
  '/capacity/planning',
  '/teams/overview',
  '/teams/composition',
])

export function isNavRouteShipped(href: string): boolean {
  return SHIPPED_NAV_HREFS.has(href)
}
