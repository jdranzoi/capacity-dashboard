import { isLeadershipRoleKey, legendRoleSortRank } from '@/lib/domain/role-keys'
import type {
  CollaborationEdge,
  CollaborationNode,
  CollaborationProjectRef,
} from '@/lib/teams/collaboration/collaboration-types'
export function collaborationEdgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function formatProjectTypeLabel(type: string): string {
  return type
    .split(/[\s_-]+/)
    .map((word) => (word.length > 0 ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export function findEdgeByKey(
  edges: CollaborationEdge[],
  key: string | null
): CollaborationEdge | null {
  if (!key) return null
  return edges.find((edge) => collaborationEdgeKey(edge.source, edge.target) === key) ?? null
}

export function legendRolesFromNodes(
  nodes: CollaborationNode[]
): { key: string; label: string }[] {
  const seen = new Map<string, string>()
  for (const node of nodes) {
    if (!seen.has(node.roleKey)) seen.set(node.roleKey, node.roleLabel)
  }
  return [...seen.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => {
      const rank = legendRoleSortRank(a.key) - legendRoleSortRank(b.key)
      if (rank !== 0) return rank
      return a.label.localeCompare(b.label, 'en')
    })
}

export function defaultVisibleRoleKeys(legendRoles: { key: string }[]): Set<string> {
  const next = new Set<string>()
  for (const role of legendRoles) {
    if (isLeadershipRoleKey(role.key)) next.add(role.key)
  }
  if (next.size === 0 && legendRoles[0]) next.add(legendRoles[0].key)
  return next
}

export function filterGraphByRoles(
  nodes: CollaborationNode[],
  edges: CollaborationEdge[],
  visibleRoleKeys: ReadonlySet<string>
): { nodes: CollaborationNode[]; edges: CollaborationEdge[] } {
  const visibleNodes = nodes.filter((node) => visibleRoleKeys.has(node.roleKey))
  const visibleIds = new Set(visibleNodes.map((node) => node.id))
  const visibleEdges = edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  )
  return { nodes: visibleNodes, edges: visibleEdges }
}

export type NeighborLink = {
  node: CollaborationNode
  sharedProjects: number
  edge: CollaborationEdge
}

export function neighborsOf(
  personId: string,
  edges: CollaborationEdge[],
  nodeById: Map<string, CollaborationNode>
): NeighborLink[] {
  const links: NeighborLink[] = []
  for (const edge of edges) {
    let otherId: string | null = null
    if (edge.source === personId) otherId = edge.target
    else if (edge.target === personId) otherId = edge.source
    if (!otherId) continue
    const node = nodeById.get(otherId)
    if (!node) continue
    links.push({ node, sharedProjects: edge.sharedProjects, edge })
  }
  return links.sort(
    (a, b) => b.sharedProjects - a.sharedProjects || a.node.name.localeCompare(b.node.name, 'en')
  )
}

export function commonNeighbors(
  aId: string,
  bId: string,
  edges: CollaborationEdge[],
  nodeById: Map<string, CollaborationNode>
): CollaborationNode[] {
  const neighborsA = new Set(neighborsOf(aId, edges, nodeById).map((link) => link.node.id))
  const result: CollaborationNode[] = []
  for (const link of neighborsOf(bId, edges, nodeById)) {
    if (link.node.id === aId || link.node.id === bId) continue
    if (neighborsA.has(link.node.id)) result.push(link.node)
  }
  return result
}

export type RoleDistributionSlice = {
  roleKey: string
  roleLabel: string
  count: number
  pct: number
}

export function roleDistribution(
  personId: string,
  edges: CollaborationEdge[],
  nodeById: Map<string, CollaborationNode>
): RoleDistributionSlice[] {
  const byRole = new Map<string, { roleLabel: string; count: number }>()
  const links = neighborsOf(personId, edges, nodeById)
  for (const link of links) {
    const entry = byRole.get(link.node.roleKey)
    if (entry) entry.count += 1
    else byRole.set(link.node.roleKey, { roleLabel: link.node.roleLabel, count: 1 })
  }
  const total = links.length
  return Array.from(byRole.entries())
    .map(([roleKey, value]) => ({
      roleKey,
      roleLabel: value.roleLabel,
      count: value.count,
      pct: total > 0 ? Math.round((value.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.roleLabel.localeCompare(b.roleLabel, 'en'))
}
