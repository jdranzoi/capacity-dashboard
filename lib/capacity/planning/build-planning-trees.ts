import {
  buildPlanningNodeMetrics,
  mergeMonthMetricsMaps,
} from '@/lib/capacity/planning/planning-metrics'
import type {
  PlanningMonthFacts,
  PlanningMonthKpi,
  PlanningMonthPersonFact,
  PlanningMonthProjectMeta,
  PlanningNodeMetrics,
  PlanningPeopleNode,
  PlanningPeriod,
  PlanningProjectMonthCell,
  PlanningProjectNode,
} from '@/lib/capacity/planning/planning-types'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { PM_ROLE_KEY } from '@/lib/domain/role-keys'

export function buildPlanningPeopleTree(
  period: PlanningPeriod,
  monthFacts: PlanningMonthFacts[]
): PlanningPeopleNode[] {
  const factsByMonth = new Map(monthFacts.map((m) => [m.monthKey, m]))
  const roleOrder = new Map<string, { roleKey: string; roleLabel: string; sortNet: number }>()
  const peopleByRole = new Map<
    string,
    Map<string, { personName: string; roleKey: string; months: Record<string, PlanningNodeMetrics> }>
  >()

  for (const monthKey of period.monthKeys) {
    const facts = factsByMonth.get(monthKey)
    if (!facts) continue
    for (const person of facts.people) {
      if (!person.roleId) continue
      const roleId = person.roleId
      if (!roleOrder.has(roleId)) {
        roleOrder.set(roleId, {
          roleKey: person.roleKey,
          roleLabel: person.roleLabel,
          sortNet: 0,
        })
      }
      roleOrder.get(roleId)!.sortNet += person.netCapacityHours

      let bucket = peopleByRole.get(roleId)
      if (!bucket) {
        bucket = new Map()
        peopleByRole.set(roleId, bucket)
      }
      let entry = bucket.get(person.personId)
      if (!entry) {
        entry = { personName: person.personName, roleKey: person.roleKey, months: {} }
        bucket.set(person.personId, entry)
      }
      entry.months[monthKey] = buildPlanningNodeMetrics(
        person.netCapacityHours,
        person.plannedHours
      )
    }
  }

  const roleIds = Array.from(roleOrder.entries())
    .sort((a, b) => b[1].sortNet - a[1].sortNet)
    .map(([id]) => id)

  return roleIds.map((roleId) => {
    const meta = roleOrder.get(roleId)!
    const peopleMap = peopleByRole.get(roleId) ?? new Map()
    const personNodes: PlanningPeopleNode[] = Array.from(peopleMap.entries())
      .map(([personId, entry]) => ({
        id: `person:${roleId}:${personId}`,
        kind: 'person' as const,
        label: entry.personName,
        depth: 1 as const,
        roleKey: entry.roleKey,
        personId,
        months: entry.months,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))

    const roleMonths = mergeMonthMetricsMaps(personNodes.map((p) => p.months))

    return {
      id: `role:${roleId}`,
      kind: 'role' as const,
      label: meta.roleLabel,
      depth: 0 as const,
      roleKey: meta.roleKey,
      months: roleMonths,
      subRows: personNodes,
    }
  })
}

export function buildPlanningMonthKpis(
  period: PlanningPeriod,
  monthFacts: PlanningMonthFacts[]
): PlanningMonthKpi[] {
  const byKey = new Map(monthFacts.map((m) => [m.monthKey, m]))
  return period.monthKeys.map((monthKey) => {
    const facts = byKey.get(monthKey)
    if (!facts) {
      return {
        monthKey,
        monthLabel: period.monthLabels[monthKey] ?? monthKey,
        netCapacityHours: 0,
        plannedHours: 0,
        openHours: 0,
        utilizationPct: null,
      }
    }

    const net = roundDisplayStat(facts.people.reduce((s, p) => s + p.netCapacityHours, 0))
    const planned = roundDisplayStat(facts.people.reduce((s, p) => s + p.plannedHours, 0))
    const metrics = buildPlanningNodeMetrics(net, planned)

    return {
      monthKey,
      monthLabel: facts.monthLabel,
      ...metrics,
    }
  })
}

function addProjectMonthHours(
  months: Record<string, PlanningProjectMonthCell>,
  monthKey: string,
  hours: number
): void {
  const prev = months[monthKey]?.plannedHours ?? 0
  months[monthKey] = { plannedHours: roundDisplayStat(prev + hours) }
}

function mergeProjectMonthMaps(
  maps: Record<string, PlanningProjectMonthCell>[]
): Record<string, PlanningProjectMonthCell> {
  const out: Record<string, PlanningProjectMonthCell> = {}
  for (const map of maps) {
    for (const [monthKey, cell] of Object.entries(map)) {
      addProjectMonthHours(out, monthKey, cell.plannedHours)
    }
  }
  return out
}

function projectSortPlanned(months: Record<string, PlanningProjectMonthCell>): number {
  return Object.values(months).reduce((s, c) => s + c.plannedHours, 0)
}

function resolvePmNameForProjectBucket(
  roles: Map<string, { roleKey: string; people: Map<string, { personName: string }> }>
): string | null {
  const pmNames: string[] = []

  for (const role of roles.values()) {
    if (role.roleKey !== PM_ROLE_KEY) continue
    for (const person of role.people.values()) {
      pmNames.push(person.personName)
    }
  }

  if (pmNames.length === 0) return null
  return pmNames.sort((a, b) => a.localeCompare(b, 'en'))[0] ?? null
}

export function buildPlanningProjectTree(
  period: PlanningPeriod,
  monthFacts: PlanningMonthFacts[]
): PlanningProjectNode[] {
  const factsByMonth = new Map(monthFacts.map((m) => [m.monthKey, m]))

  type PersonBucket = {
    personId: string
    personName: string
    roleKey: string
    months: Record<string, PlanningProjectMonthCell>
  }
  type RoleBucket = {
    roleKey: string
    roleLabel: string
    people: Map<string, PersonBucket>
  }
  type ProjectBucket = {
    meta: PlanningMonthProjectMeta
    roles: Map<string, RoleBucket>
    sortPlanned: number
  }

  const projects = new Map<string, ProjectBucket>()

  for (const monthKey of period.monthKeys) {
    const facts = factsByMonth.get(monthKey)
    if (!facts) continue

    for (const person of facts.people) {
      if (!person.roleId) continue
      for (const [projectId, hours] of person.plannedByProject.entries()) {
        if (hours <= 0) continue
        const meta = facts.projects.get(projectId)
        if (!meta) continue

        let project = projects.get(projectId)
        if (!project) {
          project = { meta, roles: new Map(), sortPlanned: 0 }
          projects.set(projectId, project)
        }
        project.sortPlanned += hours

        const roleId = person.roleId
        let role = project.roles.get(roleId)
        if (!role) {
          role = {
            roleKey: person.roleKey,
            roleLabel: person.roleLabel,
            people: new Map(),
          }
          project.roles.set(roleId, role)
        }

        let personBucket = role.people.get(person.personId)
        if (!personBucket) {
          personBucket = {
            personId: person.personId,
            personName: person.personName,
            roleKey: person.roleKey,
            months: {},
          }
          role.people.set(person.personId, personBucket)
        }
        addProjectMonthHours(personBucket.months, monthKey, hours)
      }
    }
  }

  return Array.from(projects.values())
    .sort((a, b) => b.sortPlanned - a.sortPlanned)
    .map((proj) => {
      const roleNodes: PlanningProjectNode[] = Array.from(proj.roles.values())
        .map((role) => {
          const personNodes: PlanningProjectNode[] = Array.from(role.people.values())
            .map((person) => ({
              id: `person:${proj.meta.projectId}:${role.roleKey}:${person.personId}`,
              kind: 'person' as const,
              label: person.personName,
              depth: 2 as const,
              projectId: proj.meta.projectId,
              roleKey: role.roleKey,
              personId: person.personId,
              months: person.months,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))

          return {
            id: `role:${proj.meta.projectId}:${role.roleKey}`,
            kind: 'role' as const,
            label: role.roleLabel,
            depth: 1 as const,
            projectId: proj.meta.projectId,
            roleKey: role.roleKey,
            months: mergeProjectMonthMaps(personNodes.map((p) => p.months)),
            subRows: personNodes,
          }
        })
        .sort((a, b) => projectSortPlanned(b.months) - projectSortPlanned(a.months))

      return {
        id: `project:${proj.meta.projectId}`,
        kind: 'project' as const,
        label: proj.meta.projectName,
        depth: 0 as const,
        projectId: proj.meta.projectId,
        pmName: resolvePmNameForProjectBucket(proj.roles),
        ...(proj.meta.projectType ? { projectType: proj.meta.projectType } : {}),
        months: mergeProjectMonthMaps(roleNodes.map((r) => r.months)),
        subRows: roleNodes,
      }
    })
}

