'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { formatFragmentationSeverity } from '@/lib/format/fragmentation-display'
import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import { computeCollaborationLayout, collaborationGraphViewBox } from '@/lib/teams/collaboration/collaboration-graph-layout'
import { collaborationEdgeKey } from '@/lib/teams/collaboration/collaboration-ui-utils'
import type {
  CollaborationEdge,
  CollaborationNode,
} from '@/lib/teams/collaboration/collaboration-types'

const VIEW_W = 880
const VIEW_H = 580

function nodeRadius(activeProjects: number): number {
  return Math.max(6, Math.min(20, 6 + Math.sqrt(activeProjects) * 2.6))
}

function edgeWidth(sharedProjects: number): number {
  return Math.max(0.6, Math.min(4.2, 0.6 + sharedProjects * 0.42))
}

export function CollaborationNetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeKey,
  onSelectNode,
  onSelectEdge,
  className,
}: {
  nodes: CollaborationNode[]
  edges: CollaborationEdge[]
  selectedNodeId: string | null
  selectedEdgeKey: string | null
  onSelectNode: (id: string) => void
  onSelectEdge: (key: string) => void
  className?: string
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const layout = useMemo(
    () =>
      computeCollaborationLayout(
        nodes.map((node) => ({ id: node.id, weight: node.activeProjects })),
        edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          weight: edge.sharedProjects,
        })),
        VIEW_W,
        VIEW_H
      ),
    [nodes, edges]
  )

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  const activeNodeId = hoveredNodeId ?? selectedNodeId
  const neighborIds = useMemo(() => {
    if (!activeNodeId) return null
    const set = new Set<string>([activeNodeId])
    for (const edge of edges) {
      if (edge.source === activeNodeId) set.add(edge.target)
      else if (edge.target === activeNodeId) set.add(edge.source)
    }
    return set
  }, [activeNodeId, edges])

  const hasFocus = Boolean(activeNodeId || selectedEdgeKey)
  const hoveredNode = hoveredNodeId ? nodeById.get(hoveredNodeId) ?? null : null

  const shouldShowLabel = (node: CollaborationNode) =>
    nodes.length <= 32 ||
    node.collaborators >= 3 ||
    node.id === activeNodeId ||
    node.id === selectedNodeId

  const viewBox = useMemo(
    () =>
      collaborationGraphViewBox(
        layout,
        nodes.map((node) => ({
          id: node.id,
          radius: nodeRadius(node.activeProjects),
          showLabel: shouldShowLabel(node),
        })),
        { x: 24, top: 16, bottom: 20 }
      ),
    [layout, nodes, activeNodeId, selectedNodeId]
  )

  return (
    <div
      className={cn(
        'relative min-h-0 w-full flex-1 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10',
        className
      )}
      data-slot="collaboration-graph"
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 size-full"
        role="img"
        aria-label="Collaboration network graph"
      >
        <g>
          {edges.map((edge) => {
            const a = layout.get(edge.source)
            const b = layout.get(edge.target)
            if (!a || !b) return null
            const key = collaborationEdgeKey(edge.source, edge.target)
            const isSelected = key === selectedEdgeKey
            const touchesActive =
              activeNodeId != null &&
              (edge.source === activeNodeId || edge.target === activeNodeId)
            const highlighted = isSelected || touchesActive
            const dimmed = hasFocus && !highlighted
            return (
              <line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={highlighted ? 'var(--collab-edge-strong)' : 'var(--collab-edge)'}
                strokeWidth={edgeWidth(edge.sharedProjects) * (highlighted ? 1.4 : 1)}
                strokeOpacity={dimmed ? 0.06 : highlighted ? 0.85 : 0.32}
                className="cursor-pointer transition-[stroke-opacity] duration-150"
                onClick={() => onSelectEdge(key)}
              />
            )
          })}
        </g>

        <g>
          {nodes.map((node) => {
            const p = layout.get(node.id)
            if (!p) return null
            const isSelected = node.id === selectedNodeId
            const inNeighborhood = neighborIds?.has(node.id) ?? true
            const dimmed = hasFocus && !inNeighborhood && !isSelected
            const r = nodeRadius(node.activeProjects)
            const showLabel = shouldShowLabel(node)
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                opacity={dimmed ? 0.22 : 1}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => onSelectNode(node.id)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={roleColorVar(node.roleKey)}
                  fillOpacity={0.9}
                  stroke={isSelected ? 'var(--foreground)' : 'var(--background)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {showLabel ? (
                  <text
                    x={p.x}
                    y={p.y + r + 9}
                    textAnchor="middle"
                    className="pointer-events-none fill-foreground/70 text-[10px]"
                  >
                    {node.name}
                  </text>
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>

      {hoveredNode ? (
        <div
          className="pointer-events-none absolute left-3 top-3 z-10 w-48 rounded-lg border border-border bg-popover/90 px-3 py-2 text-popover-foreground shadow-lg backdrop-blur-sm"
        >
          <p className="truncate text-sm font-medium">{hoveredNode.name}</p>
          <p className="text-[0.7rem] text-muted-foreground">{hoveredNode.roleLabel}</p>
          <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[0.7rem] tabular-nums">
            <dt className="text-muted-foreground">Projects</dt>
            <dd className="text-right">{hoveredNode.activeProjects}</dd>
            <dt className="text-muted-foreground">Collaborators</dt>
            <dd className="text-right">{hoveredNode.collaborators}</dd>
            {hoveredNode.fragmentationSeverity != null ? (
              <>
                <dt className="text-muted-foreground">Fragmentation</dt>
                <dd className="text-right">
                  {formatFragmentationSeverity(hoveredNode.fragmentationSeverity)}
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
