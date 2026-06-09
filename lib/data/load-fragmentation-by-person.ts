import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

/**
 * Row shape from `fact_fragmentation` (see capacity-mcp `006_v2_schema.sql`).
 * Columns: `person_id`, `flagged`, `total_count` (+ `source`, project arrays, etc.).
 */
export type FragmentationFactRow = {
  person_id: string
  flagged: boolean
  total_count: number
}

/**
 * Fragmentation facts for one snapshot month. No label derivation in the dashboard.
 */
export async function loadFragmentationByPerson(
  snapshotId: string,
  monthStartStr: string
): Promise<{ byPerson: Map<string, FragmentationFactRow>; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()
  const fragRes = await pagedQuery<FragmentationFactRow>(async (from) =>
    supabase
      .from('fact_fragmentation')
      .select('person_id, flagged, total_count')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .range(from, from + PAGE - 1)
  )

  if (fragRes.error) return { byPerson: new Map(), error: fragRes.error }
  return { byPerson: new Map(fragRes.rows.map((r) => [r.person_id, r])), error: null }
}
