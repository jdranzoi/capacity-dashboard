/** Shared `cacheTag` identifiers for dashboard data loaders. */

export const CACHE_TAG_OVERVIEW_MONTHS = 'overview-months'

export const CACHE_TAG_MONTH_FACTS = 'month-facts'

/** Latest `sync_snapshot` anchor (badge, loaders, sync-version baseline). */
export const CACHE_TAG_SYNC_LATEST = 'sync-latest'

export function cacheTagSnapshot(snapshotId: string): string {
  return `snapshot-${snapshotId}`
}
