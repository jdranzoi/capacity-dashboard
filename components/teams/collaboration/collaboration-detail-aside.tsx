'use client'

import { useMemo } from 'react'

import { CollaborationPersonDrawer } from '@/components/teams/collaboration/collaboration-person-drawer'
import { CollaborationRelationshipPanel } from '@/components/teams/collaboration/collaboration-relationship-panel'
import {
  commonNeighbors,
  findEdgeByKey,
  neighborsOf,
  roleDistribution,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type { CollaborationNetworkPayload } from '@/lib/teams/collaboration/collaboration-types'
import { cn } from '@/lib/utils'

export function CollaborationDetailAside({
  data,
  selectedNodeId,
  selectedEdgeKey,
  onClose,
  onSelectNode,
  className,
}: {
  data: CollaborationNetworkPayload
  selectedNodeId: string | null
  selectedEdgeKey: string | null
  onClose: () => void
  onSelectNode: (id: string) => void
  className?: string
}) {
  const nodeById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node])),
    [data.nodes]
  )

  const selectedEdge = findEdgeByKey(data.edges, selectedEdgeKey)
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null

  if (selectedEdge) {
    const personA = nodeById.get(selectedEdge.source)
    const personB = nodeById.get(selectedEdge.target)
    if (!personA || !personB) {
      return (
        <AsidePlaceholder className={className}>
          Selected relationship is no longer available for this month.
        </AsidePlaceholder>
      )
    }
    const sharedProjects = selectedEdge.projectIds
      .map((id) => data.projects[id])
      .filter((ref): ref is NonNullable<typeof ref> => Boolean(ref))
      .sort((a, b) => a.key.localeCompare(b.key, 'en'))

    return (
      <CollaborationRelationshipPanel
        edge={selectedEdge}
        personA={personA}
        personB={personB}
        sharedProjects={sharedProjects}
        sharedTeamMembers={commonNeighbors(
          selectedEdge.source,
          selectedEdge.target,
          data.edges,
          nodeById
        )}
        onClose={onClose}
        onSelectNode={onSelectNode}
        className={className}
      />
    )
  }

  if (selectedNode) {
    return (
      <CollaborationPersonDrawer
        node={selectedNode}
        neighbors={neighborsOf(selectedNode.id, data.edges, nodeById)}
        distribution={roleDistribution(selectedNode.id, data.edges, nodeById)}
        monthKey={data.monthKey}
        onClose={onClose}
        onSelectNode={onSelectNode}
        className={className}
      />
    )
  }

  return (
    <AsidePlaceholder className={className}>
      Select a relationship on the matrix or graph to see shared projects and team overlap.
    </AsidePlaceholder>
  )
}

function AsidePlaceholder({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 items-center rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      {children}
    </div>
  )
}
