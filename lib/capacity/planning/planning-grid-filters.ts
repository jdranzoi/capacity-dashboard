import {
  matchesPlannedUtilizationBand,
  type PlannedUtilizationBand,
} from '@/lib/domain/planned-utilization-band'
import { plannedPct } from '@/lib/domain/workload-metrics'
import type { ProjectSpaceTypeFilter } from '@/lib/domain/project-types'
import type { PlanningPeopleNode, PlanningProjectNode } from '@/lib/capacity/planning/planning-types'
import type { StaffFilterMode } from '@/lib/ui/staff-filter-mode'

export type PlanningUtilizationBand = PlannedUtilizationBand
export type PlanningProjectTypeFilter = ProjectSpaceTypeFilter
export type PlanningTreeExpansion = 'expand' | 'collapse'

export function personPeriodUtilizationPct(
  person: PlanningPeopleNode,
  monthKeys: string[]
): number | null {
  let net = 0
  let planned = 0
  for (const key of monthKeys) {
    const m = person.months[key]
    if (!m) continue
    net += m.netCapacityHours
    planned += m.plannedHours
  }
  return plannedPct(planned, net)
}

export function filterPeopleTreeByUtilization(
  rows: PlanningPeopleNode[],
  monthKeys: string[],
  band: PlanningUtilizationBand
): PlanningPeopleNode[] {
  if (band === 'all') return rows

  const out: PlanningPeopleNode[] = []
  for (const role of rows) {
    const people = (role.subRows ?? []).filter((person) =>
      matchesPlannedUtilizationBand(personPeriodUtilizationPct(person, monthKeys), band)
    )
    if (people.length > 0) out.push({ ...role, subRows: people })
  }
  return out
}

export function filterProjectTreeByType(
  rows: PlanningProjectNode[],
  typeFilter: PlanningProjectTypeFilter
): PlanningProjectNode[] {
  if (typeFilter === 'all') return rows
  return rows.filter((row) => row.kind === 'project' && row.projectType === typeFilter)
}

export type PlanningStaffFilterMode = StaffFilterMode

/** Prune project → role → person tree by role label or person name (same UX as people grid). */
export function filterProjectTreeByRoleOrName(
  rows: PlanningProjectNode[],
  mode: PlanningStaffFilterMode,
  roleValue: string,
  nameQuery: string
): PlanningProjectNode[] {
  if (mode === 'role' && roleValue) {
    const out: PlanningProjectNode[] = []
    for (const project of rows) {
      const roles = (project.subRows ?? []).filter((role) => role.label === roleValue)
      if (roles.length > 0) out.push({ ...project, subRows: roles })
    }
    return out
  }

  const q = nameQuery.trim().toLowerCase()
  if (mode === 'name' && q) {
    const out: PlanningProjectNode[] = []
    for (const project of rows) {
      const roles: PlanningProjectNode[] = []
      for (const role of project.subRows ?? []) {
        const people = (role.subRows ?? []).filter((person) =>
          person.label.toLowerCase().includes(q)
        )
        if (people.length > 0) roles.push({ ...role, subRows: people })
      }
      if (roles.length > 0) out.push({ ...project, subRows: roles })
    }
    return out
  }

  return rows
}
