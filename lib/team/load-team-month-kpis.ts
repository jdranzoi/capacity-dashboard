import { connection } from 'next/server'
import { endOfMonth, format, parse } from 'date-fns'

import {
  billableVersusLoggedEfficiencyPct,
  overviewWeeklyLoggedUtilizationPct,
} from '@/lib/domain/workload-metrics'
import {
  loadWeeklyOverview,
  type OrgMonthRollupHours,
} from '@/lib/overview/load-weekly-overview'
import { createServiceClientCached } from '@/lib/supabase/server'
import {
  loadProjectScopedHours,
  type ProjectScopedHours,
} from '@/lib/team/load-project-scoped-hours'
import { resolveFilteredPersonIds } from '@/lib/team/resolve-filtered-person-ids'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export type { ProjectScopedHours }

export type TeamMonthKpisPayload = {
  monthLabel: string
  /** Worklog (`logged`/`billable`) upper bound (`yyyy-MM-dd`); aligns with overview. */
  asOfDate: string | null
  snapshotId: string | null
  syncCreatedAt: string | null
  rollupHours: OrgMonthRollupHours
  /**
   * When URL `project` is set: planned + non-PTO logged/billable on that project only
   * (same snapshot, month, person scope, and worklog `asOfDate` cap). Null when no project filter.
   */
  projectScopedHours: ProjectScopedHours | null
  /**
   * Org ratio: summed logged (MTD) / monthly net capacity in snapshot facts.
   * Uses **project-scoped logged** when `projectScopedHours` is set; else org-wide logged.
   */
  utilizationOrgPct: number | null
  /** Uses project-scoped billable/logged when `projectScopedHours` is set. */
  billableEfficiencyPct: number | null
  /**
   * People with `fact_capacity` for the month (same scope as rollups, including URL filters).
   */
  headcountTotal: number
}

export async function loadTeamMonthKpis(
  monthStartStr: string,
  snapshot: { id: string; createdAt: string },
  routeFilters: TeamRouteFilters
): Promise<{ data: TeamMonthKpisPayload | null; error: string | null }> {
  await connection()
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')

  const supabase = createServiceClientCached()
  const { personIds, error: filterError } = await resolveFilteredPersonIds(
    supabase,
    snapshot.id,
    monthStartStr,
    monthEndStr,
    routeFilters
  )
  if (filterError) {
    return { data: null, error: filterError }
  }

  const personIdFilter = personIds
  const overview = await loadWeeklyOverview(
    referenceDate,
    undefined,
    snapshot,
    personIdFilter
  )

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

  let projectScopedHours: ProjectScopedHours | null = null
  if (routeFilters.projectKey) {
    const { data: projRow, error: projErr } = await supabase
      .from('dim_project')
      .select('id')
      .eq('project_key', routeFilters.projectKey)
      .maybeSingle()
    if (projErr) {
      return { data: null, error: projErr.message }
    }
    const logThroughStr = overview.asOfDate ?? monthEndStr
    if (projRow?.id) {
      const scoped = await loadProjectScopedHours(supabase, {
        snapshotId: snapshot.id,
        monthStartStr,
        logThroughStr,
        projectId: projRow.id,
        personIdFilter,
      })
      if (scoped.error) {
        return { data: null, error: scoped.error }
      }
      projectScopedHours = scoped.data
    } else {
      projectScopedHours = {
        plannedHours: 0,
        loggedHoursMtd: 0,
        billableHoursMtd: 0,
      }
    }
  }

  const loggedForUtil = projectScopedHours?.loggedHoursMtd ?? rollupHours.loggedHoursMtd
  const billableForEff = projectScopedHours?.billableHoursMtd ?? rollupHours.billableHoursMtd
  const loggedForEff = projectScopedHours?.loggedHoursMtd ?? rollupHours.loggedHoursMtd

  const utilizationOrgPct = overviewWeeklyLoggedUtilizationPct(
    loggedForUtil,
    rollupHours.netCapacityHours
  )
  const billableEfficiencyPct = billableVersusLoggedEfficiencyPct(
    billableForEff,
    loggedForEff
  )

  return {
    data: {
      monthLabel: overview.monthLabel,
      asOfDate: overview.asOfDate,
      snapshotId: overview.snapshotId,
      syncCreatedAt: overview.syncCreatedAt,
      rollupHours,
      projectScopedHours,
      utilizationOrgPct,
      billableEfficiencyPct,
      headcountTotal: overview.capacityHeadcount,
    },
    error: null,
  }
}
