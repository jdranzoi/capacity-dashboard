import { endOfMonth, format, parse } from 'date-fns'

import {
  capacityFillPct,
  commercialUtilizationPct,
} from '@/lib/domain/workload-metrics'
import {
  filterRowsByPerson,
  filterWorklogsThrough,
  getMonthFactBundle,
} from '@/lib/data/load-month-fact-bundle'
import { sumLoggedHoursByCommercial } from '@/lib/capacity/shared/sum-logged-hours-by-commercial'
import {
  loadWeeklyOverview,
  type OrgMonthRollupHours,
  type WeeklyHeadline,
} from '@/lib/overview/load-weekly-overview'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadRoleAnalytics, type RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'

export type CapacityOverviewPayload = {
  asOfDate: string | null
  orgMonthRollupHours: OrgMonthRollupHours
  weeks: WeeklyHeadline[]
  utilizationPct: number | null
  capacityFillPct: number | null
  commercialUtilizationPct: number | null
  nonCommercialLoggedHoursMtd: number
  commercialLoggedHoursMtd: number
  roleSummary: RoleAnalyticsRow[]
}

export async function loadCapacityOverview(params: {
  monthStartStr: string
  snapshot: { id: string; createdAt: string }
  personIdFilter: Set<string> | null
  referenceDate?: Date
  now?: Date
}): Promise<{ data: CapacityOverviewPayload | null; error: string | null }> {
  const { monthStartStr, snapshot, personIdFilter, referenceDate, now } = params
  const monthEndStr = format(
    endOfMonth(parse(monthStartStr, 'yyyy-MM-dd', new Date())),
    'yyyy-MM-dd'
  )

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

  const logThroughStr = overview.asOfDate ?? monthEndStr
  const [bundleResult, roleResult] = await Promise.all([
    getMonthFactBundle(snapshot.id, monthStartStr, monthEndStr),
    loadRoleAnalytics(createServiceClientCached(), {
      monthStartStr,
      snapshot,
      personIdFilter,
      now,
    }),
  ])

  if (bundleResult.error || !bundleResult.data) {
    return {
      data: null,
      error: bundleResult.error
        ? `Could not load month facts: ${bundleResult.error}`
        : 'Could not load month facts (unexpected).',
    }
  }
  if (roleResult.error) {
    return { data: null, error: roleResult.error }
  }

  const wlRows = filterWorklogsThrough(
    filterRowsByPerson(bundleResult.data.worklogs, personIdFilter),
    logThroughStr
  )
  const { nonCommercialLoggedHoursMtd, commercialLoggedHoursMtd } =
    sumLoggedHoursByCommercial(wlRows)

  const capacityFillPctValue = capacityFillPct(
    rollup.loggedHoursMtd,
    rollup.netCapacityHours
  )
  const commercialUtilizationPctValue = commercialUtilizationPct(
    commercialLoggedHoursMtd,
    rollup.elapsedCapacityHours
  )

  const roleSummary = [...roleResult.data].sort(
    (a, b) => b.netCapacityHours - a.netCapacityHours
  )

  return {
    data: {
      asOfDate: overview.asOfDate,
      orgMonthRollupHours: rollup,
      weeks: overview.weeks,
      utilizationPct: overview.utilizationPct,
      capacityFillPct: capacityFillPctValue,
      commercialUtilizationPct: commercialUtilizationPctValue,
      nonCommercialLoggedHoursMtd,
      commercialLoggedHoursMtd,
      roleSummary,
    },
    error: null,
  }
}
