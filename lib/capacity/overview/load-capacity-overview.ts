import {
  capacityFillPct,
  plannedPct,
} from '@/lib/domain/workload-metrics'
import { loadCapacityBenchSummary } from '@/lib/capacity/overview/load-capacity-bench-summary'
import {
  loadWeeklyOverview,
  type OrgMonthRollupHours,
  type WeeklyHeadline,
} from '@/lib/overview/load-weekly-overview'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadTeamRoleAnalytics, type TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'

export type CapacityOverviewPayload = {
  monthLabel: string
  asOfDate: string | null
  snapshotId: string | null
  syncCreatedAt: string | null
  orgMonthRollupHours: OrgMonthRollupHours
  weeks: WeeklyHeadline[]
  utilizationPct: number | null
  capacityFillPct: number | null
  plannedPct: number | null
  benchHours: number
  benchHeadcount: number
  benchRatePct: number | null
  capacityHeadcount: number
  roleSummary: TeamRoleAnalyticsRow[]
}

export async function loadCapacityOverview(params: {
  monthStartStr: string
  snapshot: { id: string; createdAt: string }
  personIdFilter: Set<string> | null
  referenceDate?: Date
  now?: Date
}): Promise<{ data: CapacityOverviewPayload | null; error: string | null }> {
  const { monthStartStr, snapshot, personIdFilter, referenceDate, now } = params

  const overview = await loadWeeklyOverview(
    referenceDate,
    now,
    snapshot,
    personIdFilter
  )

  if (overview.error) {
    return { data: null, error: overview.error }
  }

  const rollup = overview.orgMonthRollupHours
  if (!rollup) {
    return { data: null, error: 'Overview did not produce org rollup hours (unexpected).' }
  }

  const supabase = createServiceClientCached()

  const [benchResult, roleResult] = await Promise.all([
    loadCapacityBenchSummary(supabase, {
      snapshotId: snapshot.id,
      monthStartStr,
      personIdFilter,
      netCapacityHours: rollup.netCapacityHours,
    }),
    loadTeamRoleAnalytics(supabase, {
      monthStartStr,
      snapshot,
      personIdFilter,
      now,
    }),
  ])

  if (benchResult.error || !benchResult.data) {
    return {
      data: null,
      error: benchResult.error ?? 'Could not load bench summary.',
    }
  }
  if (roleResult.error) {
    return { data: null, error: roleResult.error }
  }

  const capacityFillPctValue = capacityFillPct(
    rollup.loggedHoursMtd,
    rollup.netCapacityHours
  )
  const plannedPctValue = plannedPct(rollup.plannedHours, rollup.netCapacityHours)

  const roleSummary = [...roleResult.data].sort(
    (a, b) => b.netCapacityHours - a.netCapacityHours
  )

  return {
    data: {
      monthLabel: overview.monthLabel,
      asOfDate: overview.asOfDate,
      snapshotId: overview.snapshotId,
      syncCreatedAt: overview.syncCreatedAt,
      orgMonthRollupHours: rollup,
      weeks: overview.weeks,
      utilizationPct: overview.utilizationPct,
      capacityFillPct: capacityFillPctValue,
      plannedPct: plannedPctValue,
      benchHours: benchResult.data.benchHours,
      benchHeadcount: benchResult.data.benchHeadcount,
      benchRatePct: benchResult.data.benchRatePct,
      capacityHeadcount: overview.capacityHeadcount,
      roleSummary,
    },
    error: null,
  }
}
