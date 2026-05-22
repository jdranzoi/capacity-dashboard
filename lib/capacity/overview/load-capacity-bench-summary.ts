import type { SupabaseClient } from '@supabase/supabase-js'

import { benchRateHoursPct } from '@/lib/domain/workload-metrics'
import { filterRowsByPerson } from '@/lib/data/load-month-fact-bundle'
import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import type { Database } from '@/lib/supabase/database.types'

type BenchRow = {
  person_id: string
  availability_hours: number | null
  is_bench: boolean
}

export type CapacityBenchSummary = {
  benchHours: number
  benchHeadcount: number
  benchRatePct: number | null
}

/**
 * Org bench roll-up from pre-computed `fact_bench` (latest snapshot month).
 */
export async function loadCapacityBenchSummary(
  supabase: SupabaseClient<Database>,
  params: {
    snapshotId: string
    monthStartStr: string
    personIdFilter: Set<string> | null
    netCapacityHours: number
  }
): Promise<{ data: CapacityBenchSummary | null; error: string | null }> {
  const { snapshotId, monthStartStr, personIdFilter, netCapacityHours } = params

  const benchRes = await pagedQuery<BenchRow>(async (from) =>
    supabase
      .from('fact_bench')
      .select('person_id, availability_hours, is_bench')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .order('person_id')
      .range(from, from + 1000 - 1)
  )

  if (benchRes.error) {
    return { data: null, error: `fact_bench: ${benchRes.error}` }
  }

  const rows = filterRowsByPerson(benchRes.rows, personIdFilter)

  let benchHours = 0
  let benchHeadcount = 0
  for (const r of rows) {
    const avail = Number(r.availability_hours ?? 0)
    if (avail > 0) {
      benchHours += avail
    }
    if (r.is_bench) {
      benchHeadcount += 1
    }
  }

  return {
    data: {
      benchHours: roundDisplayStat(benchHours),
      benchHeadcount,
      benchRatePct: benchRateHoursPct(benchHours, netCapacityHours),
    },
    error: null,
  }
}
