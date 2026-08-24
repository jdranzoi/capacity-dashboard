import type { ProjectSpaceType } from '@/lib/domain/project-types'
import { isTlRoleKey, roleSortIndex } from '@/lib/domain/role-keys'
import { matchesProjectManagerQuery } from '@/lib/workforce/project-manager'

export type CompositionView = 'type' | 'pm'

export type TeamsCompositionMember = {
  personId: string
  personName: string
  roleKey: string
  roleLabel: string
  isPm: boolean
}

export type TeamsCompositionMemberGroup = {
  roleKey: string
  roleLabel: string
  members: TeamsCompositionMember[]
}

export type TeamsCompositionPmMember = {
  personId: string
  personName: string
}

export type TeamsCompositionProject = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: ProjectSpaceType
  pmName: string | null
  pmSortKey: string
  pmMembers: TeamsCompositionPmMember[]
  memberGroups: TeamsCompositionMemberGroup[]
}

export type TeamsCompositionTypeGroup = {
  projectType: ProjectSpaceType
  label: string
  projects: TeamsCompositionProject[]
}

export type TeamsCompositionPmGroup = {
  personId: string | null
  personName: string
  projects: TeamsCompositionProject[]
}

export type TeamsCompositionPayload = {
  monthLabel: string
  snapshotId: string
  syncCreatedAt: string | null
  personQuery: string | null
  projectQuery: string | null
  pmQuery: string | null
  groups: TeamsCompositionTypeGroup[]
  totalProjectCount: number
  visibleProjectCount: number
}

export const UNASSIGNED_PM_LABEL = 'No project manager'

export function parseCompositionView(
  raw: string | string[] | undefined
): CompositionView {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'pm' ? 'pm' : 'type'
}

export function projectCardTitle(project: {
  projectKey: string
  projectName: string | null
}): string {
  const name = project.projectName?.trim()
  if (name && name !== project.projectKey) {
    return `${project.projectKey} — ${name}`
  }
  return project.projectKey
}

export function projectSortLabel(project: {
  projectKey: string
  projectName: string | null
}): string {
  const name = project.projectName?.trim()
  const label = name && name !== project.projectKey ? name : project.projectKey
  return label.toLocaleLowerCase('en')
}

export function buildMemberRoleGroups(
  members: TeamsCompositionMember[]
): TeamsCompositionMemberGroup[] {
  const byRole = new Map<string, TeamsCompositionMemberGroup>()

  for (const member of members) {
    const existing = byRole.get(member.roleKey)
    if (existing) {
      existing.members.push(member)
      continue
    }
    byRole.set(member.roleKey, {
      roleKey: member.roleKey,
      roleLabel: member.roleLabel,
      members: [member],
    })
  }

  for (const group of byRole.values()) {
    group.members.sort((a, b) => a.personName.localeCompare(b.personName, 'en'))
  }

  return Array.from(byRole.values()).sort((a, b) => {
    const orderCmp = roleSortIndex(a.roleKey) - roleSortIndex(b.roleKey)
    if (orderCmp !== 0) return orderCmp
    return a.roleLabel.localeCompare(b.roleLabel, 'en')
  })
}

export function resolvePmMembersForMembers(
  members: TeamsCompositionMember[]
): TeamsCompositionPmMember[] {
  return members
    .filter((member) => member.isPm)
    .map((member) => ({
      personId: member.personId,
      personName: member.personName,
    }))
    .sort((a, b) => a.personName.localeCompare(b.personName, 'en'))
}

export function resolvePmForMembers(
  members: TeamsCompositionMember[]
): { pmName: string | null; pmSortKey: string } {
  const pms = resolvePmMembersForMembers(members)

  if (pms.length === 0) {
    return { pmName: null, pmSortKey: '\uffff' }
  }

  return { pmName: pms[0]!.personName, pmSortKey: pms[0]!.personName.toLocaleLowerCase('en') }
}

export function resolveTlNamesForMembers(members: TeamsCompositionMember[]): string | null {
  const tls = members
    .filter((m) => isTlRoleKey(m.roleKey))
    .map((m) => m.personName)
    .sort((a, b) => a.localeCompare(b, 'en'))

  if (tls.length === 0) return null
  return tls.join(', ')
}

export function sortCompositionProjects(
  projects: TeamsCompositionProject[]
): TeamsCompositionProject[] {
  return [...projects].sort((a, b) => {
    const pmCmp = a.pmSortKey.localeCompare(b.pmSortKey, 'en')
    if (pmCmp !== 0) return pmCmp
    return projectSortLabel(a).localeCompare(projectSortLabel(b), 'en')
  })
}

export function sortProjectsByName(
  projects: TeamsCompositionProject[]
): TeamsCompositionProject[] {
  return [...projects].sort((a, b) =>
    projectSortLabel(a).localeCompare(projectSortLabel(b), 'en')
  )
}

export function memberMatchesPersonQuery(
  member: TeamsCompositionMember,
  personQuery: string
): boolean {
  const q = personQuery.trim().toLowerCase()
  if (!q) return true
  return member.personName.toLowerCase().includes(q)
}

export function projectMatchesPersonQuery(
  project: TeamsCompositionProject,
  personQuery: string | null | undefined
): boolean {
  const q = personQuery?.trim()
  if (!q) return true
  return project.memberGroups.some((group) =>
    group.members.some((member) => memberMatchesPersonQuery(member, q))
  )
}

export function projectMatchesProjectQuery(
  project: { projectKey: string; projectName: string | null },
  projectQuery: string | null | undefined
): boolean {
  const q = projectQuery?.trim().toLowerCase()
  if (!q) return true

  const key = project.projectKey.toLowerCase()
  const name = project.projectName?.trim().toLowerCase() ?? ''
  const combined = name && name !== key ? `${key} — ${name}` : key

  return key.includes(q) || name.includes(q) || combined.includes(q)
}

export function projectMatchesPmQuery(
  project: TeamsCompositionProject,
  pmQuery: string | null | undefined
): boolean {
  const q = pmQuery?.trim()
  if (!q) return true
  if (project.pmMembers.length > 0) {
    return project.pmMembers.some((pm) => matchesProjectManagerQuery(pm.personName, q))
  }
  return matchesProjectManagerQuery(project.pmName, q)
}

export function projectMatchesCompositionFilters(
  project: TeamsCompositionProject,
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
    pmQuery?: string | null
  }
): boolean {
  if (!projectMatchesProjectQuery(project, filters.projectQuery)) return false
  if (!projectMatchesPmQuery(project, filters.pmQuery)) return false
  return projectMatchesPersonQuery(project, filters.personQuery)
}

export function filterProjectsByCompositionQueries(
  projects: TeamsCompositionProject[],
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
    pmQuery?: string | null
  }
): TeamsCompositionProject[] {
  return projects.filter((project) => projectMatchesCompositionFilters(project, filters))
}

export function filterProjectsByPersonQuery(
  projects: TeamsCompositionProject[],
  personQuery: string | null | undefined
): TeamsCompositionProject[] {
  return filterProjectsByCompositionQueries(projects, { personQuery })
}

export function buildTypeGroup(
  projectType: ProjectSpaceType,
  label: string,
  projects: TeamsCompositionProject[],
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
    pmQuery?: string | null
  }
): TeamsCompositionTypeGroup {
  const sorted = sortCompositionProjects(projects)
  return {
    projectType,
    label,
    projects: filterProjectsByCompositionQueries(sorted, filters),
  }
}

export function flattenVisibleProjects(
  groups: TeamsCompositionTypeGroup[]
): TeamsCompositionProject[] {
  const seen = new Set<string>()
  const projects: TeamsCompositionProject[] = []

  for (const group of groups) {
    for (const project of group.projects) {
      if (seen.has(project.projectId)) continue
      seen.add(project.projectId)
      projects.push(project)
    }
  }

  return projects
}

export function buildPmGroups(
  projects: TeamsCompositionProject[],
  options?: { pmQuery?: string | null }
): TeamsCompositionPmGroup[] {
  const pmQuery = options?.pmQuery
  const byPm = new Map<string, TeamsCompositionPmGroup>()
  const unassigned: TeamsCompositionProject[] = []

  for (const project of projects) {
    if (project.pmMembers.length === 0) {
      if (!pmQuery?.trim()) {
        unassigned.push(project)
      }
      continue
    }

    for (const pm of project.pmMembers) {
      if (pmQuery?.trim() && !matchesProjectManagerQuery(pm.personName, pmQuery)) {
        continue
      }

      let group = byPm.get(pm.personId)
      if (!group) {
        group = {
          personId: pm.personId,
          personName: pm.personName,
          projects: [],
        }
        byPm.set(pm.personId, group)
      }
      group.projects.push(project)
    }
  }

  const groups = Array.from(byPm.values()).sort((a, b) =>
    a.personName.localeCompare(b.personName, 'en')
  )

  for (const group of groups) {
    group.projects = sortProjectsByName(group.projects)
  }

  if (unassigned.length > 0) {
    groups.push({
      personId: null,
      personName: UNASSIGNED_PM_LABEL,
      projects: sortProjectsByName(unassigned),
    })
  }

  return groups
}

export function compositionSectionId(projectType: ProjectSpaceType): string {
  return `teams-composition-${projectType}`
}

export function compositionPmSectionId(personId: string | null): string {
  return personId
    ? `teams-composition-pm-${personId}`
    : 'teams-composition-pm-unassigned'
}

export function teamsCompositionPersonHref(personName: string, monthKey: string): string {
  const params = new URLSearchParams({ q: personName, month: monthKey })
  return `/teams/composition?${params.toString()}`
}
