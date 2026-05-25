import { CACHE_TAG_SYNC_LATEST } from '@/lib/data/cache-tags'
import { createServiceClientCached } from '@/lib/supabase/server'
import { cacheLife, cacheTag } from 'next/cache'

export type LatestSyncSnapshot = {
  id: string
  /** Ingestion `sync_snapshot.taken_at` (when the run was taken). */
  createdAt: string
}

async function queryLatestSyncSnapshot(): Promise<LatestSyncSnapshot | null> {
  const supabase = createServiceClientCached()
  const { data, error } = await supabase
    .from('sync_snapshot')
    .select('id, taken_at')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id as string,
    createdAt: data.taken_at as string,
  }
}

/**
 * Uncached read for `/api/sync-version` and other live freshness probes.
 */
export async function getLatestSyncSnapshotLive(): Promise<LatestSyncSnapshot | null> {
  return queryLatestSyncSnapshot()
}

/** Most recent `sync_snapshot` row — anchor for snapshot fact tables and the sync badge. */
export async function getLatestSyncSnapshot(): Promise<LatestSyncSnapshot | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAG_SYNC_LATEST)

  return queryLatestSyncSnapshot()
}
