import { eachMonthOfInterval, format } from 'date-fns'

import { buildCapacityYear } from '@/lib/capacity/overview/build-capacity-year'
import { loadCapacityPlanMonths } from '@/lib/capacity/overview/load-capacity-plan-months'
import { loadCapacityYearFacts } from '@/lib/capacity/overview/load-capacity-year-facts'
import { loadContractorMonthHours } from '@/lib/capacity/overview/load-contractor-month-hours'
import type { CapacityYearPayload } from '@/lib/capacity/overview/capacity-year-types'
import { getLatestSyncSnapshot } from '@/lib/data/latest-sync-snapshot'
import { loadProjectTypes } from '@/lib/data/load-project-types'

/**
 * Months after the current one through December of next year: not synced yet, read from the
 * latest snapshot. Its horizon (set by the sync) decides how far the plan actually reaches.
 */
function planMonthRange(now: Date): { fromMonth: string; toMonth: string } {
  return {
    fromMonth: format(new Date(now.getFullYear(), now.getMonth() + 1, 1), 'yyyy-MM-dd'),
    toMonth: format(new Date(now.getFullYear() + 1, 11, 1), 'yyyy-MM-dd'),
  }
}

export async function loadCapacityYear(now: Date = new Date()): Promise<{
  data: CapacityYearPayload | null
  error: string | null
}> {
  const range = planMonthRange(now)
  const [facts, projectTypes, snapshot] = await Promise.all([
    loadCapacityYearFacts(),
    loadProjectTypes(),
    getLatestSyncSnapshot(),
  ])
  if (facts.error) {
    return { data: null, error: facts.error }
  }
  if (projectTypes.error) {
    return { data: null, error: projectTypes.error }
  }
  if (!facts.data || facts.data.ops.length === 0) {
    return { data: null, error: null }
  }

  // Contractor plans come from the same snapshot as the population's Planned of each month.
  const snapshotByMonth = { ...facts.data.snapshotByMonth }
  if (snapshot) {
    const planMonths = eachMonthOfInterval({
      start: new Date(`${range.fromMonth}T00:00:00`),
      end: new Date(`${range.toMonth}T00:00:00`),
    })
    for (const month of planMonths) snapshotByMonth[format(month, 'yyyy-MM-dd')] = snapshot.id
  }

  const [plan, contractors] = await Promise.all([
    snapshot
      ? loadCapacityPlanMonths({ snapshotId: snapshot.id, ...range })
      : Promise.resolve({ rows: [], error: null }),
    loadContractorMonthHours(snapshotByMonth),
  ])
  if (plan.error) {
    return { data: null, error: plan.error }
  }
  if (contractors.error) {
    return { data: null, error: contractors.error }
  }
  return {
    data: buildCapacityYear(facts.data, projectTypes.types, plan.rows, contractors.rows, now),
    error: null,
  }
}
