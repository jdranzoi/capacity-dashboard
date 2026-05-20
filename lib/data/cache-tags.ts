/** Shared `cacheTag` identifiers for dashboard data loaders. */

export const CACHE_TAG_OVERVIEW_MONTHS = 'overview-months'

export const CACHE_TAG_MONTH_FACTS = 'month-facts'

export function cacheTagSnapshot(snapshotId: string): string {
  return `snapshot-${snapshotId}`
}
