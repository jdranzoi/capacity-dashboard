/** Shared `cacheTag` identifiers for dashboard data loaders. */

export const CACHE_TAG_OVERVIEW_MONTHS = 'overview-months'

export const CACHE_TAG_MONTH_FACTS = 'month-facts'

/** Lifetime logged and billable hours per project (`v_project_delivery_totals`). */
export const CACHE_TAG_PROJECTS_GLOBAL = 'projects-global'

/** Project type vocabulary (`dim_project_type`); refreshed with each sync. */
export const CACHE_TAG_PROJECT_CATALOG = 'project-catalog'

/** Latest `sync_snapshot` anchor (badge, loaders, sync-version baseline). */
export const CACHE_TAG_SYNC_LATEST = 'sync-latest'

/** MCT training issues + issue-grain worklogs. */
export const CACHE_TAG_TRAINING = 'training-issues'

/** Person-month ops rollups (`fact_month_ops` / `fact_month_projects`). */
export const CACHE_TAG_MONTH_OPS = 'month-ops'

export function cacheTagSnapshot(snapshotId: string): string {
  return `snapshot-${snapshotId}`
}
