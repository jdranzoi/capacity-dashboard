import { createServiceClient } from '@/lib/supabase/server'

export type LatestSyncSnapshot = {
  id: string
  /** When the run finished; use for "last ingested" freshness. */
  createdAt: string
}

/**
 * Most recent row in sync_snapshot (C-003). Required anchor for snapshot fact tables
 * and for a consistent "last sync" label in the UI.
 */
export async function getLatestSyncSnapshot(): Promise<LatestSyncSnapshot | null> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('sync_snapshot')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id as string,
    createdAt: data.created_at as string,
  }
}
