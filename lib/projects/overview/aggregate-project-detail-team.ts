import { roundDisplayStat } from '@/lib/format/display-stats'
import { roleSortIndex } from '@/lib/domain/role-keys'
import type {
  ProjectDetailTeamPersonHours,
  ProjectDetailTeamRoleHours,
} from '@/lib/projects/overview/projects-types'

type PlanInput = {
  person_id: string
  role_id: string | null
  planned_hours: number
}

type WorklogInput = {
  person_id: string
  logged_seconds: number
}

type PersonAcc = {
  plannedHours: number
  loggedHours: number
  plannedByRoleId: Map<string, number>
}

export function aggregateProjectTeamHours(params: {
  planRows: readonly PlanInput[]
  worklogRows: readonly WorklogInput[]
  namesById: ReadonlyMap<string, string>
  personRoleIdById: ReadonlyMap<string, string | null>
  roleById: ReadonlyMap<string, { key: string; label: string }>
}): ProjectDetailTeamRoleHours[] {
  const people = new Map<string, PersonAcc>()

  function accFor(personId: string): PersonAcc {
    const existing = people.get(personId)
    if (existing) return existing
    const created: PersonAcc = {
      plannedHours: 0,
      loggedHours: 0,
      plannedByRoleId: new Map(),
    }
    people.set(personId, created)
    return created
  }

  for (const row of params.planRows) {
    if (row.planned_hours <= 0) continue
    const acc = accFor(row.person_id)
    acc.plannedHours += row.planned_hours
    if (row.role_id) {
      acc.plannedByRoleId.set(
        row.role_id,
        (acc.plannedByRoleId.get(row.role_id) ?? 0) + row.planned_hours
      )
    }
  }

  for (const row of params.worklogRows) {
    const hours = Number(row.logged_seconds) / 3600
    if (hours <= 0) continue
    accFor(row.person_id).loggedHours += hours
  }

  const byRole = new Map<
    string,
    {
      roleKey: string
      roleLabel: string
      plannedHours: number
      loggedHours: number
      people: ProjectDetailTeamPersonHours[]
    }
  >()

  for (const [personId, acc] of people) {
    const roleId = pickRoleId(acc.plannedByRoleId) ?? params.personRoleIdById.get(personId) ?? null
    const role = roleId ? params.roleById.get(roleId) : null
    const roleKey = role?.key ?? 'unknown'
    const roleLabel = role?.label ?? 'Unknown'
    const person: ProjectDetailTeamPersonHours = {
      personId,
      personName: params.namesById.get(personId) ?? personId,
      plannedHours: roundDisplayStat(acc.plannedHours),
      loggedHours: roundDisplayStat(acc.loggedHours),
    }

    const group = byRole.get(roleKey)
    if (group) {
      group.plannedHours += person.plannedHours
      group.loggedHours += person.loggedHours
      group.people.push(person)
    } else {
      byRole.set(roleKey, {
        roleKey,
        roleLabel,
        plannedHours: person.plannedHours,
        loggedHours: person.loggedHours,
        people: [person],
      })
    }
  }

  const roles: ProjectDetailTeamRoleHours[] = []
  for (const group of byRole.values()) {
    group.people.sort((a, b) => {
      if (b.loggedHours !== a.loggedHours) return b.loggedHours - a.loggedHours
      return a.personName.localeCompare(b.personName, 'en')
    })
    roles.push({
      roleKey: group.roleKey,
      roleLabel: group.roleLabel,
      plannedHours: roundDisplayStat(group.plannedHours),
      loggedHours: roundDisplayStat(group.loggedHours),
      people: group.people,
    })
  }

  roles.sort((a, b) => {
    const orderCmp = roleSortIndex(a.roleKey) - roleSortIndex(b.roleKey)
    if (orderCmp !== 0) return orderCmp
    return a.roleLabel.localeCompare(b.roleLabel, 'en')
  })

  return roles
}

function pickRoleId(plannedByRoleId: Map<string, number>): string | null {
  let bestId: string | null = null
  let bestHours = 0
  for (const [roleId, hours] of plannedByRoleId) {
    if (hours > bestHours) {
      bestHours = hours
      bestId = roleId
    }
  }
  return bestId
}
