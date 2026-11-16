import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_PROJECT_CATALOG } from '@/lib/data/cache-tags'
import { compareProjectTypes, type ProjectTypeOption } from '@/lib/domain/project-types'
import { createServiceClientCached } from '@/lib/supabase/server'

/** `dim_project_type` in display order (D-033). */
export async function loadProjectTypes(): Promise<{
  types: ProjectTypeOption[]
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_PROJECT_CATALOG)

  const supabase = createServiceClientCached()
  const { data, error } = await supabase
    .from('dim_project_type')
    .select('key, label, is_commercial')
  if (error) return { types: [], error: `dim_project_type: ${error.message}` }

  const types = (data ?? [])
    .map((row) => ({ value: row.key, label: row.label, isCommercial: row.is_commercial }))
    .sort(compareProjectTypes)
  return { types, error: null }
}
