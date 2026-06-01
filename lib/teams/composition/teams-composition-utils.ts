export const PM_ROLE_KEY = 'pm'

export type CompositionProjectType = 'build' | 'support' | 'internal'

export const COMPOSITION_TYPE_SECTIONS: ReadonlyArray<{
  projectType: CompositionProjectType
  label: string
}> = [
  { projectType: 'build', label: 'Build' },
  { projectType: 'support', label: 'Support' },
  { projectType: 'internal', label: 'Internal' },
]

/** Roster group order on project cards (`dim_role.key`). */
export const COMPOSITION_MEMBER_ROLE_ORDER: readonly string[] = [
  'pm',
  'tl',
  'fsd',
  'fed',
  'qa',
  'analytics',
  'ux',
  'em',
]

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

export type TeamsCompositionProject = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: CompositionProjectType
  pmName: string | null
  pmSortKey: string
  memberGroups: TeamsCompositionMemberGroup[]
}

export type TeamsCompositionTypeGroup = {
  projectType: CompositionProjectType
  label: string
  projects: TeamsCompositionProject[]
}

export type TeamsCompositionPayload = {
  monthLabel: string
  snapshotId: string
  syncCreatedAt: string | null
  personQuery: string | null
  projectQuery: string | null
  groups: TeamsCompositionTypeGroup[]
  totalProjectCount: number
  visibleProjectCount: number
}

export function isCompositionProjectType(value: string): value is CompositionProjectType {
  return value === 'build' || value === 'support' || value === 'internal'
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

export function roleSortIndex(roleKey: string): number {
  const idx = COMPOSITION_MEMBER_ROLE_ORDER.indexOf(roleKey)
  return idx === -1 ? COMPOSITION_MEMBER_ROLE_ORDER.length : idx
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

export function resolvePmForMembers(
  members: TeamsCompositionMember[]
): { pmName: string | null; pmSortKey: string } {
  const pms = members
    .filter((m) => m.isPm)
    .map((m) => m.personName)
    .sort((a, b) => a.localeCompare(b, 'en'))

  if (pms.length === 0) {
    return { pmName: null, pmSortKey: '\uffff' }
  }

  return { pmName: pms[0]!, pmSortKey: pms[0]!.toLocaleLowerCase('en') }
}

const TL_ROLE_KEY = 'tl'

export function resolveTlNamesForMembers(members: TeamsCompositionMember[]): string | null {
  const tls = members
    .filter((m) => m.roleKey === TL_ROLE_KEY)
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

export function projectMatchesCompositionFilters(
  project: TeamsCompositionProject,
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
  }
): boolean {
  if (!projectMatchesProjectQuery(project, filters.projectQuery)) return false
  return projectMatchesPersonQuery(project, filters.personQuery)
}

export function filterProjectsByCompositionQueries(
  projects: TeamsCompositionProject[],
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
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
  projectType: CompositionProjectType,
  label: string,
  projects: TeamsCompositionProject[],
  filters: {
    personQuery?: string | null
    projectQuery?: string | null
  }
): TeamsCompositionTypeGroup {
  const sorted = sortCompositionProjects(projects)
  return {
    projectType,
    label,
    projects: filterProjectsByCompositionQueries(sorted, filters),
  }
}

export function compositionSectionId(projectType: CompositionProjectType): string {
  return `teams-composition-${projectType}`
}
