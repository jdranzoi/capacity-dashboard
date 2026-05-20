import { revalidateTag } from 'next/cache'

import {
  CACHE_TAG_MONTH_FACTS,
  CACHE_TAG_OVERVIEW_MONTHS,
  cacheTagSnapshot,
} from '@/lib/data/cache-tags'

export type InvalidateDashboardCacheOptions = {
  /** When set, also bust cached month-fact bundles for this snapshot. */
  snapshotId?: string
}

/**
 * Stale-while-revalidate invalidation for dashboard `'use cache'` loaders.
 * Call after sync-v2 completes (webhook) or manually from ops.
 */
/** Matches `cacheLife('hours')` on `loadOverviewMonthOptions`. */
const MONTH_OPTIONS_PROFILE = 'hours'

/** Bust month-fact bundles tagged with inline `cacheLife({ stale, revalidate })`. */
const MONTH_FACTS_PROFILE = { expire: 0 }

export function invalidateDashboardCache(
  options: InvalidateDashboardCacheOptions = {}
): void {
  revalidateTag(CACHE_TAG_OVERVIEW_MONTHS, MONTH_OPTIONS_PROFILE)
  revalidateTag(CACHE_TAG_MONTH_FACTS, MONTH_FACTS_PROFILE)
  if (options.snapshotId) {
    revalidateTag(cacheTagSnapshot(options.snapshotId), MONTH_FACTS_PROFILE)
  }
}
