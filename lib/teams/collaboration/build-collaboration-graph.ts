import type { FragmentationFactRow } from '@/lib/data/load-fragmentation-by-person'
import {
  collaborationEdgeKey,
  formatProjectTypeLabel,
  PM_ROLE_KEY,
  TL_ROLE_KEY,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type {
  CollaborationEdge,
  CollaborationInsights,
  CollaborationKpis,
  CollaborationMatrix,
  CollaborationMatrixCell,
  CollaborationNode,
  CollaborationProjectRef,
} from '@/lib/teams/collaboration/collaboration-types'

export { PM_ROLE_KEY, TL_ROLE_KEY } from '@/lib/teams/collaboration/collaboration-ui-utils'

/** One person's footprint on one project within the range. */
export type ParticipationRecord = {
  personId: string
  projectId: string
  /** Earliest `month_date` with a plan assignment (`yyyy-MM-dd`). */
  firstLog: string
  /** Latest `month_date` with a plan assignment (`yyyy-MM-dd`). */
  lastLog: string
  /** True when the person is planned on this project in the anchor month. */
  loggedInAnchorMonth: boolean
}

export type PersonMeta = {
  id: string
  name: string
  roleKey: string
  roleLabel: string
  zoneKey: string | null
  zoneLabel: string | null
  isActive: boolean
}

export type BuildCollaborationGraphInput = {
  participations: ParticipationRecord[]
  peopleById: Map<string, PersonMeta>
  projectsById: Map<string, CollaborationProjectRef>
  /** When not `all`, edges and per-node project counts use matching `project_type` only. */
  category?: string
  /** Anchor-month `fact_fragmentation` rows — pass-through only, no label rules here. */
  fragmentationByPerson?: Map<string, FragmentationFactRow>
}

const CATEGORY_ALL = 'all'

function buildProjectKpis(
  participations: ParticipationRecord[],
  peopleById: Map<string, PersonMeta>,
  projectsById: Map<string, CollaborationProjectRef>
): Pick<CollaborationKpis, 'totalProjects' | 'projectsByType'> {
  const projectIds = new Set<string>()
  for (const record of participations) {
    if (!peopleById.has(record.personId)) continue
    if (!projectsById.has(record.projectId)) continue
    projectIds.add(record.projectId)
  }

  const byType = new Map<string, number>()
  for (const projectId of projectIds) {
    const ref = projectsById.get(projectId)!
    byType.set(ref.type, (byType.get(ref.type) ?? 0) + 1)
  }

  const projectsByType = Array.from(byType.entries())
    .map(([type, count]) => ({
      type,
      label: formatProjectTypeLabel(type),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en'))

  return { totalProjects: projectIds.size, projectsByType }
}

export type CollaborationGraphResult = {
  nodes: CollaborationNode[]
  edges: CollaborationEdge[]
  projects: Record<string, CollaborationProjectRef>
  matrix: CollaborationMatrix
  kpis: CollaborationKpis
  insights: CollaborationInsights
}

type EdgeAccumulator = {
  source: string
  target: string
  projectIds: string[]
  currentProjects: number
  firstCollaboration: string | null
  lastCollaboration: string | null
}

/**
 * Builds the collaboration graph from per-(person, project) participation records.
 *
 * Pure: no I/O. Edge strength is shared-project count only (hours excluded by design).
 * First/last collaboration are approximated per shared project as the overlap of each
 * person's first/last log dates, then reduced across shared projects.
 */
export function buildCollaborationGraph(
  input: BuildCollaborationGraphInput
): CollaborationGraphResult {
  const {
    participations,
    peopleById,
    projectsById,
    category = CATEGORY_ALL,
    fragmentationByPerson,
  } = input

  const projectInScope = (projectId: string): boolean => {
    const project = projectsById.get(projectId)
    if (!project) return false
    if (category === CATEGORY_ALL) return true
    return project.type === category
  }

  const recordKey = (personId: string, projectId: string) => `${personId}|${projectId}`
  const recordIndex = new Map<string, ParticipationRecord>()
  const projectMembers = new Map<string, string[]>()
  const rosterPersonIds = new Set<string>()
  const scopedProjectsByPerson = new Map<string, Set<string>>()
  const totalProjectsByPerson = new Map<string, Set<string>>()
  const usedProjectIds = new Set<string>()

  for (const record of participations) {
    if (!peopleById.has(record.personId)) continue
    if (!projectsById.has(record.projectId)) continue

    rosterPersonIds.add(record.personId)
    recordIndex.set(recordKey(record.personId, record.projectId), record)

    const allProjects = totalProjectsByPerson.get(record.personId)
    if (allProjects) {
      allProjects.add(record.projectId)
    } else {
      totalProjectsByPerson.set(record.personId, new Set([record.projectId]))
    }

    if (!projectInScope(record.projectId)) continue

    usedProjectIds.add(record.projectId)

    const members = projectMembers.get(record.projectId)
    if (members) {
      members.push(record.personId)
    } else {
      projectMembers.set(record.projectId, [record.personId])
    }

    const projects = scopedProjectsByPerson.get(record.personId)
    if (projects) {
      projects.add(record.projectId)
    } else {
      scopedProjectsByPerson.set(record.personId, new Set([record.projectId]))
    }
  }

  const edges = new Map<string, EdgeAccumulator>()

  for (const [projectId, members] of projectMembers) {
    const unique = Array.from(new Set(members)).sort()
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const a = unique[i]!
        const b = unique[j]!
        const recA = recordIndex.get(recordKey(a, projectId))!
        const recB = recordIndex.get(recordKey(b, projectId))!

        const coStart = recA.firstLog > recB.firstLog ? recA.firstLog : recB.firstLog
        const coEnd = recA.lastLog < recB.lastLog ? recA.lastLog : recB.lastLog
        const bothCurrent = recA.loggedInAnchorMonth && recB.loggedInAnchorMonth

        const key = collaborationEdgeKey(a, b)
        const existing = edges.get(key)
        if (existing) {
          existing.projectIds.push(projectId)
          if (bothCurrent) existing.currentProjects += 1
          if (existing.firstCollaboration == null || coStart < existing.firstCollaboration) {
            existing.firstCollaboration = coStart
          }
          if (existing.lastCollaboration == null || coEnd > existing.lastCollaboration) {
            existing.lastCollaboration = coEnd
          }
        } else {
          edges.set(key, {
            source: a,
            target: b,
            projectIds: [projectId],
            currentProjects: bothCurrent ? 1 : 0,
            firstCollaboration: coStart,
            lastCollaboration: coEnd,
          })
        }
      }
    }
  }

  const degree = new Map<string, number>()
  for (const acc of edges.values()) {
    degree.set(acc.source, (degree.get(acc.source) ?? 0) + 1)
    degree.set(acc.target, (degree.get(acc.target) ?? 0) + 1)
  }

  const nodes: CollaborationNode[] = []
  for (const personId of rosterPersonIds) {
    const meta = peopleById.get(personId)
    if (!meta) continue
    const totalProjects = totalProjectsByPerson.get(personId)?.size ?? 0
    const activeProjects = scopedProjectsByPerson.get(personId)?.size ?? 0
    const collaborators = degree.get(personId) ?? 0
    const frag = fragmentationByPerson?.get(personId)
    nodes.push({
      id: personId,
      name: meta.name,
      roleKey: meta.roleKey,
      roleLabel: meta.roleLabel,
      zoneKey: meta.zoneKey,
      zoneLabel: meta.zoneLabel,
      isActive: meta.isActive,
      totalProjects,
      activeProjects,
      collaborators,
      fragmentationFlagged: frag?.flagged ?? null,
      fragmentationTotalCount: frag?.total_count ?? null,
    })
  }
  nodes.sort((a, b) => b.collaborators - a.collaborators || a.name.localeCompare(b.name, 'en'))

  const edgeList: CollaborationEdge[] = Array.from(edges.values())
    .map((acc) => ({
      source: acc.source,
      target: acc.target,
      sharedProjects: acc.projectIds.length,
      currentProjects: acc.currentProjects,
      firstCollaboration: acc.firstCollaboration,
      lastCollaboration: acc.lastCollaboration,
      projectIds: acc.projectIds,
    }))
    .sort((a, b) => b.sharedProjects - a.sharedProjects)

  const projects: Record<string, CollaborationProjectRef> = {}
  for (const projectId of usedProjectIds) {
    const ref = projectsById.get(projectId)
    if (ref) projects[projectId] = ref
  }

  const matrix = buildMatrix(peopleById, projectMembers)
  const projectKpis = buildProjectKpis(participations, peopleById, projectsById)
  const kpis = { ...buildKpis(nodes, edgeList), ...projectKpis }
  const insights = buildInsights(nodes, edgeList, matrix)

  return { nodes, edges: edgeList, projects, matrix, kpis, insights }
}

function buildMatrix(
  peopleById: Map<string, PersonMeta>,
  projectMembers: Map<string, string[]>
): CollaborationMatrix {
  const pms = Array.from(peopleById.values())
    .filter((person) => person.roleKey === PM_ROLE_KEY)
    .map((person) => ({ id: person.id, name: person.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const tls = Array.from(peopleById.values())
    .filter((person) => person.roleKey === TL_ROLE_KEY)
    .map((person) => ({ id: person.id, name: person.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const roleById = new Map(
    Array.from(peopleById.entries()).map(([id, person]) => [id, person.roleKey])
  )

  const cellCounts = new Map<string, number>()

  for (const [projectId, members] of projectMembers) {
    const unique = Array.from(new Set(members))
    const pmIds = unique.filter((id) => roleById.get(id) === PM_ROLE_KEY)
    const tlIds = unique.filter((id) => roleById.get(id) === TL_ROLE_KEY)
    for (const pmId of pmIds) {
      for (const tlId of tlIds) {
        const key = `${pmId}|${tlId}`
        cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
      }
    }
  }

  const cells: CollaborationMatrixCell[] = []
  let maxValue = 0
  for (const [key, sharedProjects] of cellCounts) {
    const [pmId, tlId] = key.split('|') as [string, string]
    if (sharedProjects <= 0) continue
    cells.push({ pmId, tlId, sharedProjects })
    if (sharedProjects > maxValue) maxValue = sharedProjects
  }

  return { pms, tls, cells, maxValue }
}

function buildKpis(
  nodes: CollaborationNode[],
  edges: CollaborationEdge[]
): Omit<CollaborationKpis, 'totalProjects' | 'projectsByType'> {
  const activeCollaborators = nodes.length
  const totalDegree = nodes.reduce((sum, node) => sum + node.collaborators, 0)
  const avgConnections =
    activeCollaborators > 0
      ? Math.round((totalDegree / activeCollaborators) * 10) / 10
      : 0

  const possibleConnections =
    activeCollaborators > 1 ? (activeCollaborators * (activeCollaborators - 1)) / 2 : 0
  const collaborationDensityPct =
    possibleConnections > 0 ? Math.round((edges.length / possibleConnections) * 100) : 0

  const mostConnectedTl = mostConnectedTlNode(nodes)

  return {
    activeCollaborators,
    avgConnections,
    mostConnectedTl,
    collaborationDensityPct,
    stableSquads: null,
  }
}

function mostConnectedTlNode(
  nodes: CollaborationNode[]
): { id: string; name: string; connections: number } | null {
  let best: CollaborationNode | null = null
  for (const node of nodes) {
    if (node.roleKey !== TL_ROLE_KEY) continue
    if (!best || node.collaborators > best.collaborators) best = node
  }
  return best ? { id: best.id, name: best.name, connections: best.collaborators } : null
}

function buildInsights(
  nodes: CollaborationNode[],
  edges: CollaborationEdge[],
  matrix: CollaborationMatrix
): CollaborationInsights {
  const nameById = new Map(nodes.map((node) => [node.id, node.name]))

  let strongest: CollaborationMatrixCell | null = null
  for (const cell of matrix.cells) {
    if (!strongest || cell.sharedProjects > strongest.sharedProjects) strongest = cell
  }
  const strongestPmTlPair =
    strongest && nameById.has(strongest.pmId) && nameById.has(strongest.tlId)
      ? {
          pm: { id: strongest.pmId, name: nameById.get(strongest.pmId)! },
          tl: { id: strongest.tlId, name: nameById.get(strongest.tlId)! },
          sharedProjects: strongest.sharedProjects,
        }
      : null

  let fragmented: CollaborationNode | null = null
  for (const node of nodes) {
    if (node.fragmentationTotalCount == null) continue
    if (
      !fragmented ||
      node.fragmentationTotalCount > (fragmented.fragmentationTotalCount ?? -1)
    ) {
      fragmented = node
    }
  }
  const highestFragmentation = fragmented
    ? {
        id: fragmented.id,
        name: fragmented.name,
        totalCount: fragmented.fragmentationTotalCount ?? 0,
        flagged: fragmented.fragmentationFlagged ?? false,
      }
    : null

  const isolatedResources = nodes.filter((node) => node.collaborators <= 1).length

  return {
    strongestPmTlPair,
    highestFragmentation,
    mostConnectedTl: mostConnectedTlNode(nodes),
    isolatedResources,
  }
}
