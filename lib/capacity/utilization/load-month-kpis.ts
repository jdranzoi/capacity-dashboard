import { endOfMonth, format, parse } from 'date-fns'

import {
  filterRowsByPerson,
  filterWorklogsThrough,
  getMonthFactBundle,
} from '@/lib/data/load-month-fact-bundle'
import {
  billableVersusLoggedEfficiencyPct,
  capacityFillPct,
} from '@/lib/domain/workload-metrics'
import {
  loadWeeklyOverview,
  type OrgMonthRollupHours,
} from '@/lib/overview/load-weekly-overview'
import { createServiceClientCached } from '@/lib/supabase/server'
import {
  loadProjectScopedHours,
  type ProjectScopedHours,
} from '@/lib/capacity/utilization/load-project-scoped-hours'
import { sumLoggedHoursByCommercial } from '@/lib/capacity/utilization/sum-logged-hours-by-commercial'
import type { PersonScopeFilters } from '@/lib/workforce/person-scope-filters'

export type { ProjectScopedHours }

export type UtilizationMonthKpisPayload = {
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
   * **Capacity fill** — summed logged (MTD) / monthly net capacity in snapshot facts.
   * Uses **project-scoped logged** when `projectScopedHours` is set; else org-wide logged.
   */
  capacityFillPct: number | null
  /**
   * **Utilization** — mean per-person pace (logged MTD / (elapsed net weekdays × 8h)),
   * same filters as `loadWeeklyOverview`. Uses **all** non-PTO logs per person when a project filter
   * is active (not project-scoped hours).
   */
  utilizationPct: number | null
  /** Uses project-scoped billable/logged when `projectScopedHours` is set. */
  billableEfficiencyPct: number | null
  /** Non-PTO logged hours where `fact_worklogs.is_commercial` is false (MTD worklog cap). */
  nonCommercialLoggedHoursMtd: number
  /** Non-PTO logged hours where `fact_worklogs.is_commercial` is true (MTD worklog cap). */
  commercialLoggedHoursMtd: number
}

export async function loadUtilizationMonthKpis(
  monthStartStr: string,
  snapshot: { id: string; createdAt: string },
  routeFilters: PersonScopeFilters,
  /** Pre-resolved from `resolveFilteredPersonIds` (must match URL filters). */
  personIdFilter: Set<string> | null
): Promise<{ data: UtilizationMonthKpisPayload | null; error: string | null }> {
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')

  const supabase = createServiceClientCached()

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

  const logThroughStr = overview.asOfDate ?? monthEndStr
  let projectScopedHours: ProjectScopedHours | null = null
  let filteredProjectId: string | null = null

  if (routeFilters.projectKey) {
    const { data: projRow, error: projErr } = await supabase
      .from('dim_project')
      .select('id')
      .eq('project_key', routeFilters.projectKey)
      .maybeSingle()
    if (projErr) {
      return { data: null, error: projErr.message }
    }
    if (projRow?.id) {
      filteredProjectId = projRow.id
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

  const bundleResult = await getMonthFactBundle(snapshot.id, monthStartStr, monthEndStr)
  if (bundleResult.error || !bundleResult.data) {
    return {
      data: null,
      error: bundleResult.error
        ? `Could not load month facts: ${bundleResult.error}`
        : 'Could not load month facts (unexpected).',
    }
  }

  let wlRows = filterWorklogsThrough(
    filterRowsByPerson(bundleResult.data.worklogs, personIdFilter),
    logThroughStr
  )
  if (filteredProjectId) {
    wlRows = wlRows.filter((r) => r.project_id === filteredProjectId)
  }

  const { nonCommercialLoggedHoursMtd, commercialLoggedHoursMtd } =
    sumLoggedHoursByCommercial(wlRows)

  const loggedForUtil = projectScopedHours?.loggedHoursMtd ?? rollupHours.loggedHoursMtd
  const billableForEff = projectScopedHours?.billableHoursMtd ?? rollupHours.billableHoursMtd
  const loggedForEff = projectScopedHours?.loggedHoursMtd ?? rollupHours.loggedHoursMtd

  const capacityFillPctValue = capacityFillPct(
    loggedForUtil,
    rollupHours.netCapacityHours
  )
  const utilizationPctValue = overview.utilizationPct
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
      capacityFillPct: capacityFillPctValue,
      utilizationPct: utilizationPctValue,
      billableEfficiencyPct,
      nonCommercialLoggedHoursMtd,
      commercialLoggedHoursMtd,
    },
    error: null,
  }
}
