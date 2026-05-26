import type { CompositionProjectType } from '@/lib/teams/composition/teams-composition-utils'

export type PlanningView = 'people' | 'project'

export type PlanningPeriod = {
  fromMonthKey: string
  toMonthKey: string
  monthKeys: string[]
  monthLabels: Record<string, string>
}

export type PlanningNodeMetrics = {
  netCapacityHours: number
  plannedHours: number
  openHours: number
  utilizationPct: number | null
}

export type PlanningPeopleNode = {
  id: string
  kind: 'role' | 'person'
  label: string
  depth: 0 | 1
  roleKey?: string
  personId?: string
  months: Record<string, PlanningNodeMetrics>
  subRows?: PlanningPeopleNode[]
}

export type PlanningProjectMonthCell = {
  plannedHours: number
}

/** Project → role → person; months as column groups (planned hours only). */
export type PlanningProjectNode = {
  id: string
  kind: 'project' | 'role' | 'person'
  label: string
  depth: 0 | 1 | 2
  projectId?: string
  projectType?: CompositionProjectType
  roleKey?: string
  personId?: string
  months: Record<string, PlanningProjectMonthCell>
  subRows?: PlanningProjectNode[]
}

export type PlanningMonthKpi = PlanningNodeMetrics & {
  monthKey: string
  monthLabel: string
  rolesAtOrAbove90Pct: number
  roleCount: number
  rolesAbove90SharePct: number | null
}

export type PlanningAvailablePerson = {
  personId: string
  personName: string
  roleLabel: string
  availableHours: number
  projectCount: number
  fragmentationLabel: 'Healthy' | 'Moderate' | 'High'
}

export type PlanningAvailabilityEvent = {
  monthKey: string
  monthLabel: string
  /** Display code (e.g. FSD, TL) or full label for unassigned. */
  roleCode: string
  roleLabel: string
  headcount: number
}

export type CapacityPlanningWorkspacePayload = {
  period: PlanningPeriod
  monthKpis: PlanningMonthKpi[]
  peopleTreeRows: PlanningPeopleNode[]
  projectTreeRows: PlanningProjectNode[]
  upcomingAvailability: PlanningAvailabilityEvent[]
}

/** Raw person facts for one month — loader output before tree builders. */
export type PlanningMonthPersonFact = {
  personId: string
  personName: string
  roleId: string | null
  roleKey: string
  roleLabel: string
  netCapacityHours: number
  plannedHours: number
  plannedByProject: Map<string, number>
}

export type PlanningMonthProjectMeta = {
  projectId: string
  projectKey: string
  projectName: string
  /** Normalized `dim_project.project_type` when build | support | internal. */
  projectType: CompositionProjectType | null
}

export type PlanningMonthFacts = {
  monthKey: string
  monthLabel: string
  monthStartStr: string
  snapshotId: string
  people: PlanningMonthPersonFact[]
  projects: Map<string, PlanningMonthProjectMeta>
  roleStats: { roleCount: number; rolesAtOrAbove90Pct: number }
}
