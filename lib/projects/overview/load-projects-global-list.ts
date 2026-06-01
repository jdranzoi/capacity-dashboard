import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_PROJECTS_GLOBAL } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { loggedVersusPlannedProductivityPct } from '@/lib/domain/workload-metrics'
import {
  isProjectAtRisk,
  orgBurnRateHoursPerMonth,
  projectBurnRateHoursPerMonth,
  projectOverrunHours,
  projectBudgetUsedPct,
} from '@/lib/domain/project-delivery-metrics'
import { loadOverviewMonthOptions } from '@/lib/overview/overview-month-options'
import { loadActiveProjects } from '@/lib/projects/overview/load-active-projects'
import {
  lastNMonthStarts,
  loadLifetimePlannedHoursByProject,
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
}): Promise<{ data: ProjectsOverviewPayload | null; error: string | null }> {
  const burnMonthKeys = lastNMonthStarts(params.anchorMonthStartStr, 3)

  const [monthOptionsRes, totalsRes, projectsRes] = await Promise.all([
    loadOverviewMonthOptions(),
    loadProjectsGlobalTotalsCached(),
    loadActiveProjects(),
  ])

  if (monthOptionsRes.error) {
    return { data: null, error: monthOptionsRes.error }
  }
  if (totalsRes.error) {
    return { data: null, error: totalsRes.error }
  }
  if (projectsRes.error) {
    return { data: null, error: projectsRes.error }
  }

  const [burnActualsRes, lifetimePlannedRes] = await Promise.all([
    loadProjectActualsForMonthsFromOptions(burnMonthKeys, monthOptionsRes.options),
    loadLifetimePlannedHoursByProject({
      anchorMonthStartStr: params.anchorMonthStartStr,
      options: monthOptionsRes.options,
      projects: projectsRes.rows,
    }),
  ])

  if (burnActualsRes.error) {
    return { data: null, error: burnActualsRes.error }
  }
  if (lifetimePlannedRes.error) {
    return { data: null, error: lifetimePlannedRes.error }
  }

  const projectMetaById = new Map(projectsRes.rows.map((p) => [p.id, p]))

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

  for (const total of totalsRes.rows) {
    const meta = projectMetaById.get(total.project_id)
    if (!meta) continue
    if (!matchesProjectsCategory(meta.project_type, params.category)) continue
    if (!matchesProjectsSearch(meta.project_key, meta.project_name, params.searchQuery)) {
      continue
    }

    const plannedHours =
      lifetimePlannedRes.byProject.get(total.project_id) ??
      roundDisplayStat(Number(total.lifetime_planned_hours))
    const loggedHours = roundDisplayStat(Number(total.lifetime_logged_hours))
    const billableHours = roundDisplayStat(Number(total.lifetime_billable_hours))

    if (plannedHours <= 0 && loggedHours <= 0) continue

    rows.push({
      projectId: meta.id,
      projectKey: meta.project_key,
      projectName: meta.project_name,
      projectType: meta.project_type,
      status: meta.status,
      startDate: meta.start_date,
      budgetHours: meta.budget_hours,
      plannedHours,
      loggedHours,
      billableHours,
      budgetUsedPct: projectBudgetUsedPct(loggedHours, meta.budget_hours),
      overrunHours: projectOverrunHours(loggedHours, plannedHours),
      atRisk: isProjectAtRisk(loggedHours, plannedHours),
      burnRateHoursPerMonth: projectBurnRateHoursPerMonth(burnByProject.get(meta.id) ?? []),
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
        'Global view: lifetime logged and billable from worklogs; planned hours sum monthly plans from project start (each month uses its sync snapshot). Burn rate uses the last 3 months, each from its month sync.',
      kpis,
      rows,
    },
    error: null,
  }
}
