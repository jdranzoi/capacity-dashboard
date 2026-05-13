import { parse } from 'date-fns'

import {
  billableVersusLoggedEfficiencyPct,
  overviewWeeklyLoggedUtilizationPct,
} from '@/lib/domain/workload-metrics'
import {
  loadWeeklyOverview,
  type OrgMonthRollupHours,
} from '@/lib/overview/load-weekly-overview'

export type TeamMonthKpisPayload = {
  monthLabel: string
  /** Worklog (`logged`/`billable`) upper bound (`yyyy-MM-dd`); aligns with overview. */
  asOfDate: string | null
  snapshotId: string | null
  syncCreatedAt: string | null
  rollupHours: OrgMonthRollupHours
  /**
   * Org ratio: summed logged (MTD) / monthly net capacity in snapshot facts.
   * Mirrors overview weekly-detail MTD totals column semantics (`overviewWeeklyLoggedUtilizationPct`).
   */
  utilizationOrgPct: number | null
  /** `@/lib/domain/workload-metrics.billableVersusLoggedEfficiencyPct`. */
  billableEfficiencyPct: number | null
}

export async function loadTeamMonthKpis(
  monthStartStr: string,
  snapshot: { id: string; createdAt: string }
): Promise<{ data: TeamMonthKpisPayload | null; error: string | null }> {
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const overview = await loadWeeklyOverview(referenceDate, undefined, snapshot)

  if (overview.error) {
    return { data: null, error: overview.error }
  }

  const rollupHours = overview.orgMonthRollupHours
  if (!rollupHours) {
    return {
      data: null,
      error: 'Overview did not produce org rollup hours (unexpected).',
    }
  }

  const utilizationOrgPct = overviewWeeklyLoggedUtilizationPct(
    rollupHours.loggedHoursMtd,
    rollupHours.netCapacityHours
  )
  const billableEfficiencyPct = billableVersusLoggedEfficiencyPct(
    rollupHours.billableHoursMtd,
    rollupHours.loggedHoursMtd
  )

  return {
    data: {
      monthLabel: overview.monthLabel,
      asOfDate: overview.asOfDate,
      snapshotId: overview.snapshotId,
      syncCreatedAt: overview.syncCreatedAt,
      rollupHours,
      utilizationOrgPct,
      billableEfficiencyPct,
    },
    error: null,
  }
}
