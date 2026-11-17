import { format } from 'date-fns'

import { buildCapacityYear } from '@/lib/capacity/overview/build-capacity-year'
import { loadCapacityPlanMonths } from '@/lib/capacity/overview/load-capacity-plan-months'
import {
  loadCapacityYearFacts,
  type CapacityYearOpsRow,
} from '@/lib/capacity/overview/load-capacity-year-facts'
import type { CapacityYearPayload } from '@/lib/capacity/overview/capacity-year-types'
import { getLatestSyncSnapshot } from '@/lib/data/latest-sync-snapshot'
import { loadProjectTypes } from '@/lib/data/load-project-types'

/**
 * Months after the current one through December of next year: not synced yet, read from the
 * latest snapshot. Its horizon (set by the sync) decides how far the plan actually reaches.
 */
async function loadPlanMonths(
  now: Date
): Promise<{ rows: CapacityYearOpsRow[]; error: string | null }> {
  const snapshot = await getLatestSyncSnapshot()
  if (!snapshot) return { rows: [], error: null }
  return loadCapacityPlanMonths({
    snapshotId: snapshot.id,
    fromMonth: format(new Date(now.getFullYear(), now.getMonth() + 1, 1), 'yyyy-MM-dd'),
    toMonth: format(new Date(now.getFullYear() + 1, 11, 1), 'yyyy-MM-dd'),
  })
}

export async function loadCapacityYear(now: Date = new Date()): Promise<{
  data: CapacityYearPayload | null
  error: string | null
}> {
  const [facts, projectTypes, plan] = await Promise.all([
    loadCapacityYearFacts(),
    loadProjectTypes(),
    loadPlanMonths(now),
  ])
  if (facts.error) {
    return { data: null, error: facts.error }
  }
  if (projectTypes.error) {
    return { data: null, error: projectTypes.error }
  }
  if (plan.error) {
    return { data: null, error: plan.error }
  }
  if (!facts.data || facts.data.ops.length === 0) {
    return { data: null, error: null }
  }
  return {
    data: buildCapacityYear(facts.data, projectTypes.types, plan.rows, now),
    error: null,
  }
}
