import type { ProjectSpaceType } from '@/lib/domain/project-types'

export type ProjectOverviewRow = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: ProjectSpaceType
  status: string
  startDate: string | null
  budgetHours: number | null
  plannedHours: number
  loggedHours: number
  billableHours: number
  budgetUsedPct: number | null
  overrunHours: number
  atRisk: boolean
  burnRateHoursPerMonth: number | null
}

export type ProjectsOverviewKpis = {
  activeProjectCount: number
  totalLoggedHours: number
  totalPlannedHours: number
  overallUtilizationPct: number | null
  projectsAtRiskCount: number
  orgBurnRateHoursPerMonth: number | null
}

export type ProjectsOverviewPayload = {
  viewMode: 'monthly' | 'global'
  monthLabel: string | null
  monthStartStr: string | null
  footnote: string
  kpis: ProjectsOverviewKpis
  rows: ProjectOverviewRow[]
}

export type ProjectExecutionGranularity = 'month' | 'day'

/** Planned and logged hours for one chart period (month or day). */
export type ProjectExecutionPoint = {
  periodKey: string
  periodLabel: string
  plannedHours: number
  loggedHours: number
}

/** @deprecated Use ProjectExecutionPoint */
export type ProjectExecutionMonthPoint = ProjectExecutionPoint

export type ProjectRoleHoursRow = {
  roleKey: string
  roleLabel: string
  hours: number
  sharePct: number
}

export type ProjectVelocityWeekPoint = {
  weekLabel: string
  loggedHours: number
}

export type ProjectExecutionScope = 'lifetime' | 'month'

export type ProjectDetailPanelPayload = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: ProjectSpaceType
  startDate: string | null
  targetReleaseDate: string | null
  budgetHours: number | null
  projectedHoursAtCompletion: number | null
  pmName: string | null
  tlNames: string | null
  plannedHoursTotal: number
  loggedHoursTotal: number
  billableHoursTotal: number
  budgetUsedPct: number | null
  teamSize: number
  monthKey: string | null
  executionSeries: ProjectExecutionPoint[]
  executionScope: ProjectExecutionScope
  executionGranularity: ProjectExecutionGranularity
  teamBreakdown: ProjectRoleHoursRow[]
  roleAllocation: ProjectRoleHoursRow[]
  velocityWeeks: ProjectVelocityWeekPoint[]
  viewMode: 'monthly' | 'global'
  monthLabel: string | null
}
