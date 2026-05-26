import { plannedPct } from '@/lib/domain/workload-metrics'
import type { CompositionProjectType } from '@/lib/teams/composition/teams-composition-utils'
import type { PlanningPeopleNode, PlanningProjectNode } from '@/lib/capacity/planning/planning-types'

export type PlanningUtilizationBand = 'all' | 'lt40' | 'lt65' | 'lt80' | 'gt80'
export type PlanningProjectTypeFilter = 'all' | CompositionProjectType
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

/** Planned utilization band for the full selected period (planned / net capacity). */
export function matchesUtilizationBand(
  pct: number | null,
  band: PlanningUtilizationBand
): boolean {
  if (band === 'all') return true
  if (pct == null) return false
  if (band === 'lt40') return pct < 40
  if (band === 'lt65') return pct < 65
  if (band === 'lt80') return pct < 80
  return pct > 80
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
      matchesUtilizationBand(personPeriodUtilizationPct(person, monthKeys), band)
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
