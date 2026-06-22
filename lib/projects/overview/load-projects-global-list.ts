import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_PROJECTS_GLOBAL } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { loggedVersusPlannedProductivityPct } from '@/lib/domain/workload-metrics'
import {
  isProjectAtBudgetRisk,
  orgBurnRateHoursPerMonth,
  projectBurnRateHoursPerMonth,
  projectOverrunHours,
  projectBudgetUsedPct,
} from '@/lib/domain/project-delivery-metrics'
import { loadOverviewMonthOptions } from '@/lib/overview/overview-month-options'
import { loadActiveProjects } from '@/lib/projects/overview/load-active-projects'
import { loadBuildProjectDeliveryMetrics } from '@/lib/projects/overview/build-project-delivery-window'
import {
  lastNMonthStarts,
  loadProjectActualsForMonthsFromOptions,
} from '@/lib/projects/overview/load-project-grain-data'
import {
  matchesProjectsCategory,
  matchesProjectsSearch,
  type ProjectsCategoryFilter,
} from '@/lib/projects/overview/projects-route-filters'
import type {
  ProjectOverviewRow,
  ProjectsOverviewKpis,
  ProjectsOverviewPayload,
} from '@/lib/projects/overview/projects-types'
import { createServiceClientCached } from '@/lib/supabase/server'

type DeliveryTotalsRow = {
  project_id: string
  project_key: string
  project_name: string | null
  project_type: string
  start_date: string | null
  budget_hours: number | null
  lifetime_logged_hours: number
  lifetime_billable_hours: number
  lifetime_planned_hours: number
}

async function loadDeliveryTotalsFromView(): Promise<{
  rows: DeliveryTotalsRow[]
  error: string | null
}> {
  const supabase = createServiceClientCached()
  const { rows, error } = await pagedQuery<DeliveryTotalsRow>(async (from) =>
    supabase
      .from('v_project_delivery_totals')
      .select(
        'project_id, project_key, project_name, project_type, start_date, budget_hours, lifetime_logged_hours, lifetime_billable_hours, lifetime_planned_hours'
      )
      .order('project_key')
      .range(from, from + 999)
  )

  if (error) {
    return { rows: [], error }
  }
  return { rows, error: null }
}

export async function loadProjectsGlobalTotalsCached(): Promise<{
  rows: DeliveryTotalsRow[]
  error: string | null
}> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_PROJECTS_GLOBAL)

  return loadDeliveryTotalsFromView()
}

export async function loadProjectsOverviewGlobal(params: {
  anchorMonthStartStr: string
  category: ProjectsCategoryFilter
  searchQuery: string | null
  fallbackSnapshotId: string
}): Promise<{ data: ProjectsOverviewPayload | null; error: string | null }> {
  const burnMonthKeys = lastNMonthStarts(params.anchorMonthStartStr, 3)

  const [monthOptionsRes, projectsRes] = await Promise.all([
    loadOverviewMonthOptions(),
    loadActiveProjects(),
  ])

  if (monthOptionsRes.error) {
    return { data: null, error: monthOptionsRes.error }
  }
  if (projectsRes.error) {
    return { data: null, error: projectsRes.error }
  }

  const filteredProjects = projectsRes.rows.filter((project) => {
    if (!matchesProjectsCategory(project.project_type, params.category)) return false
    return matchesProjectsSearch(project.project_key, project.project_name, params.searchQuery)
  })

  const [burnActualsRes, deliveryRes] = await Promise.all([
    loadProjectActualsForMonthsFromOptions(burnMonthKeys, monthOptionsRes.options),
    loadBuildProjectDeliveryMetrics({
      projects: filteredProjects.map((project) => ({
        projectId: project.id,
        startDate: project.start_date,
        endDate: project.end_date,
      })),
      historicalOptions: monthOptionsRes.options,
      fallbackSnapshotId: params.fallbackSnapshotId,
      fallbackMonthStartStr: params.anchorMonthStartStr,
    }),
  ])

  if (burnActualsRes.error) {
    return { data: null, error: burnActualsRes.error }
  }
  if (deliveryRes.error) {
    return { data: null, error: deliveryRes.error }
  }

  const burnByProject = new Map<string, number[]>()
  for (const key of burnMonthKeys) {
    const byMonth = new Map<string, number>()
    for (const row of burnActualsRes.rows) {
      if (row.month_date !== key) continue
      byMonth.set(
        row.project_id,
        roundDisplayStat((byMonth.get(row.project_id) ?? 0) + row.logged_hours)
      )
    }
    for (const [projectId, hours] of byMonth) {
      const list = burnByProject.get(projectId) ?? []
      list.push(hours)
      burnByProject.set(projectId, list)
    }
  }

  const rows: ProjectOverviewRow[] = []

  for (const project of filteredProjects) {
    const totals = deliveryRes.totalsByProject.get(project.id)
    if (!totals) continue

    const { plannedHours, loggedHours, billableHours } = totals
    if (plannedHours <= 0 && loggedHours <= 0) continue

    const budgetUsedPct = projectBudgetUsedPct(loggedHours, project.budget_hours)
    rows.push({
      projectId: project.id,
      projectKey: project.project_key,
      projectName: project.project_name,
      projectType: project.project_type,
      status: project.status,
      startDate: project.start_date,
      budgetHours: project.budget_hours,
      plannedHours,
      loggedHours,
      billableHours,
      budgetUsedPct,
      overrunHours: projectOverrunHours(loggedHours, plannedHours),
      atRisk: isProjectAtBudgetRisk(budgetUsedPct),
      burnRateHoursPerMonth: projectBurnRateHoursPerMonth(burnByProject.get(project.id) ?? []),
    })
  }

  rows.sort((a, b) => {
    const aPct = a.budgetUsedPct ?? -1
    const bPct = b.budgetUsedPct ?? -1
    if (bPct !== aPct) return bPct - aPct
    return b.loggedHours - a.loggedHours
  })

  const orgBurnMonths = burnMonthKeys.map((monthKey) =>
    roundDisplayStat(
      burnActualsRes.rows
        .filter((r) => r.month_date === monthKey)
        .reduce((s, r) => s + r.logged_hours, 0)
    )
  )

  const totalLoggedHours = roundDisplayStat(rows.reduce((s, r) => s + r.loggedHours, 0))
  const totalPlannedHours = roundDisplayStat(rows.reduce((s, r) => s + r.plannedHours, 0))

  const kpis: ProjectsOverviewKpis = {
    activeProjectCount: rows.length,
    totalLoggedHours,
    totalPlannedHours,
    overallUtilizationPct: loggedVersusPlannedProductivityPct(totalLoggedHours, totalPlannedHours),
    projectsAtRiskCount: rows.filter((r) => r.atRisk).length,
    orgBurnRateHoursPerMonth: orgBurnRateHoursPerMonth(orgBurnMonths, orgBurnMonths.length),
  }

  return {
    data: {
      viewMode: 'global',
      monthLabel: null,
      monthStartStr: null,
      footnote:
        'Build view: planned hours sum monthly plans from project start through end date (each month uses its sync snapshot). Logged and billable use the same window. Burn rate uses the last 3 months, each from its month sync.',
      kpis,
      rows,
    },
    error: null,
  }
}
