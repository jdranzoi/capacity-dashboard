import { roundDisplayStat } from '@/lib/format/display-stats'
import { loggedVersusPlannedProductivityPct } from '@/lib/domain/workload-metrics'
import {
  isProjectAtBudgetRisk,
  orgBurnRateHoursPerMonth,
  projectBurnRateHoursPerMonth,
  projectOverrunHours,
  projectBudgetUsedPct,
} from '@/lib/domain/project-delivery-metrics'
import { loadActiveProjects } from '@/lib/projects/overview/load-active-projects'
import {
  lastNMonthStarts,
  loadProjectActualsForMonths,
  loadProjectActualsForMonthsFromOptions,
  loadProjectGrainPlans,
  sumPlannedHoursByProject,
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
import type { ProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'

function buildOverviewRows(params: {
  projects: Awaited<ReturnType<typeof loadActiveProjects>>['rows']
  plannedByProject: Map<string, number>
  loggedByProject: Map<string, number>
  billableByProject: Map<string, number>
  burnByProject: Map<string, number[]>
  requireActivityInMonth: boolean
  category: ProjectsCategoryFilter
  searchQuery: string | null
}): ProjectOverviewRow[] {
  const rows: ProjectOverviewRow[] = []

  for (const project of params.projects) {
    if (!matchesProjectsCategory(project.project_type, params.category)) continue
    if (!matchesProjectsSearch(project.project_key, project.project_name, params.searchQuery)) {
      continue
    }

    const plannedHours = roundDisplayStat(params.plannedByProject.get(project.id) ?? 0)
    const loggedHours = roundDisplayStat(params.loggedByProject.get(project.id) ?? 0)
    const billableHours = roundDisplayStat(params.billableByProject.get(project.id) ?? 0)

    if (params.requireActivityInMonth && plannedHours <= 0 && loggedHours <= 0) {
      continue
    }

    const monthlyLogged = params.burnByProject.get(project.id) ?? []
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
      burnRateHoursPerMonth: projectBurnRateHoursPerMonth(monthlyLogged),
    })
  }

  rows.sort((a, b) => {
    const aPct = a.budgetUsedPct ?? -1
    const bPct = b.budgetUsedPct ?? -1
    if (bPct !== aPct) return bPct - aPct
    return b.loggedHours - a.loggedHours
  })

  return rows
}

function rollupKpis(rows: readonly ProjectOverviewRow[], burnMonthsLogged: number[]): ProjectsOverviewKpis {
  const totalLoggedHours = roundDisplayStat(rows.reduce((s, r) => s + r.loggedHours, 0))
  const totalPlannedHours = roundDisplayStat(rows.reduce((s, r) => s + r.plannedHours, 0))

  return {
    activeProjectCount: rows.length,
    totalLoggedHours,
    totalPlannedHours,
    overallUtilizationPct: loggedVersusPlannedProductivityPct(totalLoggedHours, totalPlannedHours),
    projectsAtRiskCount: rows.filter((r) => r.atRisk).length,
    orgBurnRateHoursPerMonth: orgBurnRateHoursPerMonth(burnMonthsLogged, burnMonthsLogged.length),
  }
}

export async function loadProjectsOverviewMonthly(params: {
  monthContext: ProjectsMonthContext
  category: ProjectsCategoryFilter
  searchQuery: string | null
}): Promise<{ data: ProjectsOverviewPayload | null; error: string | null }> {
  const { monthContext, category, searchQuery } = params
  const { snapshot, monthStartStr, monthLabel, options } = monthContext

  const burnMonthKeys = lastNMonthStarts(monthStartStr, 3)

  const [projectsRes, actualsRes, plansRes, burnActualsRes] = await Promise.all([
    loadActiveProjects(),
    loadProjectActualsForMonths(snapshot.id, [monthStartStr]),
    loadProjectGrainPlans(snapshot.id, monthStartStr),
    loadProjectActualsForMonthsFromOptions(burnMonthKeys, options),
  ])

  if (projectsRes.error) return { data: null, error: projectsRes.error }
  if (actualsRes.error) return { data: null, error: actualsRes.error }
  if (plansRes.error) return { data: null, error: plansRes.error }
  if (burnActualsRes.error) return { data: null, error: burnActualsRes.error }

  const plannedByProject = sumPlannedHoursByProject(plansRes.rows)
  const loggedByProject = new Map<string, number>()
  const billableByProject = new Map<string, number>()

  for (const row of actualsRes.rows) {
    if (row.month_date !== monthStartStr) continue
    loggedByProject.set(
      row.project_id,
      roundDisplayStat((loggedByProject.get(row.project_id) ?? 0) + row.logged_hours)
    )
    billableByProject.set(
      row.project_id,
      roundDisplayStat((billableByProject.get(row.project_id) ?? 0) + row.billable_hours)
    )
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

  const rows = buildOverviewRows({
    projects: projectsRes.rows,
    plannedByProject,
    loggedByProject,
    billableByProject,
    burnByProject,
    requireActivityInMonth: true,
    category,
    searchQuery,
  })

  const orgBurnMonths = burnMonthKeys.map((monthKey) =>
    roundDisplayStat(
      burnActualsRes.rows
        .filter((r) => r.month_date === monthKey)
        .reduce((s, r) => s + r.logged_hours, 0)
    )
  )

  return {
    data: {
      viewMode: 'monthly',
      monthLabel,
      monthStartStr,
      footnote: 'All hours from Tempo data. Monthly view uses snapshot project actuals for the selected month.',
      kpis: rollupKpis(rows, orgBurnMonths),
      rows,
    },
    error: null,
  }
}
