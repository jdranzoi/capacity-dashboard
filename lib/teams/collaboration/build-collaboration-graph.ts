import type { FragmentationFactRow } from '@/lib/data/load-fragmentation-by-person'
import { isPmRoleKey, isTlRoleKey } from '@/lib/domain/role-keys'
import {
  collaborationEdgeKey,
  formatProjectTypeLabel,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type {
  CollaborationKpis,
  CollaborationMatrix,
  CollaborationMatrixCell,
  CollaborationNode,
  CollaborationProjectRef,
} from '@/lib/teams/collaboration/collaboration-types'

export type ParticipationRecord = {
  personId: string
  projectId: string
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

export type BuiltCollaborationEdge = {
  source: string
  target: string
  sharedProjects: number
  projectIds: string[]
}

export type CollaborationGraphResult = {
  nodes: CollaborationNode[]
  edges: BuiltCollaborationEdge[]
  projects: Record<string, CollaborationProjectRef>
  matrix: CollaborationMatrix
  kpis: CollaborationKpis
}

type EdgeAccumulator = {
  source: string
  target: string
  projectIds: string[]
}

/**
 * Builds the collaboration graph from per-(person, project) participation in the anchor month.
 * Edge weight is shared-project count in that month (planned hours excluded by design).
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

  const projectMembers = new Map<string, string[]>()
  const rosterPersonIds = new Set<string>()
  const scopedProjectsByPerson = new Map<string, Set<string>>()
  const totalProjectsByPerson = new Map<string, Set<string>>()
  const usedProjectIds = new Set<string>()

  for (const record of participations) {
    if (!peopleById.has(record.personId)) continue
    if (!projectsById.has(record.projectId)) continue

    rosterPersonIds.add(record.personId)

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

        const key = collaborationEdgeKey(a, b)
        const existing = edges.get(key)
        if (existing) {
          existing.projectIds.push(projectId)
        } else {
          edges.set(key, {
            source: a,
            target: b,
            projectIds: [projectId],
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
      fragmentationSeverity: frag?.flagged ?? null,
      fragmentationTotalCount: frag?.total_count ?? null,
    })
  }
  nodes.sort((a, b) => b.collaborators - a.collaborators || a.name.localeCompare(b.name, 'en'))

  const edgeList: BuiltCollaborationEdge[] = Array.from(edges.values())
    .map((acc) => ({
      source: acc.source,
      target: acc.target,
      sharedProjects: acc.projectIds.length,
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

  return { nodes, edges: edgeList, projects, matrix, kpis }
}

function buildMatrix(
  peopleById: Map<string, PersonMeta>,
  projectMembers: Map<string, string[]>
): CollaborationMatrix {
  const pms = Array.from(peopleById.values())
    .filter((person) => isPmRoleKey(person.roleKey))
    .map((person) => ({ id: person.id, name: person.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const tls = Array.from(peopleById.values())
    .filter((person) => isTlRoleKey(person.roleKey))
    .map((person) => ({ id: person.id, name: person.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const roleById = new Map(
    Array.from(peopleById.entries()).map(([id, person]) => [id, person.roleKey])
  )

  const cellCounts = new Map<string, number>()

  for (const [projectId, members] of projectMembers) {
    const unique = Array.from(new Set(members))
    const pmIds = unique.filter((id) => {
      const key = roleById.get(id)
      return key != null && isPmRoleKey(key)
    })
    const tlIds = unique.filter((id) => {
      const key = roleById.get(id)
      return key != null && isTlRoleKey(key)
    })
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
  edges: BuiltCollaborationEdge[]
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
    if (!isTlRoleKey(node.roleKey)) continue
    if (!best || node.collaborators > best.collaborators) best = node
  }
  return best ? { id: best.id, name: best.name, connections: best.collaborators } : null
}
