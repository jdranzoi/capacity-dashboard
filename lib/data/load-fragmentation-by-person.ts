import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import {
  fragmentationSeverityFromFlagged,
  type FragmentationSeverity,
} from '@/lib/domain/fragmentation-label'
import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

/**
 * Row shape from `fact_fragmentation` (capacity-mcp migration 023).
 * `flagged` is ingestion severity: `low` | `moderate` | `high`.
 */
export type FragmentationFactRow = {
  person_id: string
  flagged: FragmentationSeverity
  total_count: number
}

/**
 * Fragmentation facts for one snapshot month. Severity comes from sync — no dashboard rules.
 */
export async function loadFragmentationByPerson(
  snapshotId: string,
  monthStartStr: string
): Promise<{ byPerson: Map<string, FragmentationFactRow>; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()
  type FragmentationFactRowRaw = {
    person_id: string
    flagged: string
    total_count: number
  }

  const fragRes = await pagedQuery<FragmentationFactRowRaw>(async (from) =>
    supabase
      .from('fact_fragmentation')
      .select('person_id, flagged, total_count')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .range(from, from + PAGE - 1)
  )

  if (fragRes.error) return { byPerson: new Map(), error: fragRes.error }

  const byPerson = new Map<string, FragmentationFactRow>()
  for (const row of fragRes.rows) {
    byPerson.set(row.person_id, {
      person_id: row.person_id,
      flagged: fragmentationSeverityFromFlagged(row.flagged),
      total_count: row.total_count,
    })
  }
  return { byPerson, error: null }
}
