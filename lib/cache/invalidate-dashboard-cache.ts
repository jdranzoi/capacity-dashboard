import { revalidateTag } from 'next/cache'

import {
  CACHE_TAG_MONTH_FACTS,
  CACHE_TAG_OVERVIEW_MONTHS,
  CACHE_TAG_PROJECTS_GLOBAL,
  CACHE_TAG_SYNC_LATEST,
  cacheTagSnapshot,
} from '@/lib/data/cache-tags'

export type InvalidateDashboardCacheOptions = {
  /** When set, also bust cached month-fact bundles for this snapshot. */
  snapshotId?: string
}

/** Bust tagged `'use cache'` loaders after ingestion or manual ops trigger. */
/** Matches `cacheLife('hours')` on `loadOverviewMonthOptions`. */
const MONTH_OPTIONS_PROFILE = 'hours'

/** Bust month-fact bundles tagged with inline `cacheLife({ stale, revalidate })`. */
const MONTH_FACTS_PROFILE = { expire: 0 }

/** Matches `cacheLife('minutes')` on `getLatestSyncSnapshot` / `SyncStatus`. */
const SYNC_LATEST_PROFILE = 'minutes'

export function invalidateDashboardCache(
  options: InvalidateDashboardCacheOptions = {}
): void {
  revalidateTag(CACHE_TAG_SYNC_LATEST, SYNC_LATEST_PROFILE)
  revalidateTag(CACHE_TAG_OVERVIEW_MONTHS, MONTH_OPTIONS_PROFILE)
  revalidateTag(CACHE_TAG_MONTH_FACTS, MONTH_FACTS_PROFILE)
  revalidateTag(CACHE_TAG_PROJECTS_GLOBAL, MONTH_FACTS_PROFILE)
  if (options.snapshotId) {
    revalidateTag(cacheTagSnapshot(options.snapshotId), MONTH_FACTS_PROFILE)
  }
}
