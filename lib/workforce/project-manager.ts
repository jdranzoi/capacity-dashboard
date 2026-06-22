import { PM_ROLE_KEY } from '@/lib/domain/role-keys'
import { resolvePmForMembers, type TeamsCompositionMember } from '@/lib/teams/composition/teams-composition-utils'

export type ProjectPmPlanRow = {
  person_id: string
  project_id: string
  role_id: string | null
  planned_hours: number
}

export function matchesProjectManagerQuery(
  pmName: string | null | undefined,
  query: string | null | undefined
): boolean {
  const q = query?.trim().toLowerCase()
  if (!q) return true
  if (!pmName) return false
  return pmName.toLowerCase().includes(q)
}

/** PM name per project from stamped plan rows (first PM alphabetically, same as composition cards). */
export function buildPmNamesByProjectId(params: {
  planRows: readonly ProjectPmPlanRow[]
  pmRoleId: string | null
  namesById: ReadonlyMap<string, string>
}): Map<string, string | null> {
  const membersByProject = new Map<string, Map<string, TeamsCompositionMember>>()

  for (const row of params.planRows) {
    if (row.planned_hours <= 0) continue

    let byPerson = membersByProject.get(row.project_id)
    if (!byPerson) {
      byPerson = new Map()
      membersByProject.set(row.project_id, byPerson)
    }

    const existing = byPerson.get(row.person_id)
    const isPm = params.pmRoleId != null && row.role_id === params.pmRoleId
    if (!existing) {
      byPerson.set(row.person_id, {
        personId: row.person_id,
        personName: params.namesById.get(row.person_id) ?? 'Unknown',
        roleKey: isPm ? PM_ROLE_KEY : 'unknown',
        roleLabel: isPm ? 'PM' : 'Unknown',
        isPm,
      })
      continue
    }

    if (isPm) {
      existing.isPm = true
      existing.roleKey = PM_ROLE_KEY
      existing.roleLabel = 'PM'
    }
  }

  const result = new Map<string, string | null>()
  for (const [projectId, byPerson] of membersByProject) {
    const { pmName } = resolvePmForMembers(Array.from(byPerson.values()))
    result.set(projectId, pmName)
  }

  return result
}

export function collectPmPersonIdsFromPlanRows(
  planRows: readonly ProjectPmPlanRow[],
  pmRoleId: string | null
): Set<string> {
  const ids = new Set<string>()
  if (!pmRoleId) return ids

  for (const row of planRows) {
    if (row.planned_hours <= 0) continue
    if (row.role_id === pmRoleId) {
      ids.add(row.person_id)
    }
  }

  return ids
}
