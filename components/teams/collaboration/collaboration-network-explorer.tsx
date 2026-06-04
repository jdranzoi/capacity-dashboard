'use client'

import { useEffect, useMemo, useState } from 'react'

import { CollaborationDetailAside } from '@/components/teams/collaboration/collaboration-detail-aside'
import { CollaborationInsightsPanel } from '@/components/teams/collaboration/collaboration-insights-panel'
import { CollaborationMatrix } from '@/components/teams/collaboration/collaboration-matrix'
import { CollaborationNetworkGraph } from '@/components/teams/collaboration/collaboration-network-graph'
import { CollaborationRoleLegend } from '@/components/teams/collaboration/collaboration-role-legend'
import {
  defaultVisibleRoleKeys,
  filterGraphByRoles,
  legendRolesFromNodes,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type { CollaborationNetworkPayload } from '@/lib/teams/collaboration/collaboration-types'

export function CollaborationNetworkExplorer({ data }: { data: CollaborationNetworkPayload }) {
  const legendRoles = useMemo(() => legendRolesFromNodes(data.nodes), [data.nodes])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(data.focusPersonId)
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null)
  const [visibleRoleKeys, setVisibleRoleKeys] = useState<Set<string>>(() =>
    defaultVisibleRoleKeys(legendRoles)
  )

  useEffect(() => {
    setVisibleRoleKeys(defaultVisibleRoleKeys(legendRoles))
    setSelectedNodeId(data.focusPersonId)
    setSelectedEdgeKey(null)
  }, [data.monthKey, data.focusPersonId, legendRoles])

  const { nodes: visibleNodes, edges: visibleEdges } = useMemo(
    () => filterGraphByRoles(data.nodes, data.edges, visibleRoleKeys),
    [data.nodes, data.edges, visibleRoleKeys]
  )

  const selectNode = (id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeKey(null)
  }
  const selectEdge = (key: string) => {
    setSelectedEdgeKey(key)
    setSelectedNodeId(null)
  }
  const clearSelection = () => {
    setSelectedNodeId(null)
    setSelectedEdgeKey(null)
  }

  if (data.nodes.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        No collaboration activity for this month and category.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <CollaborationMatrix
          matrix={data.matrix}
          selectedEdgeKey={selectedEdgeKey}
          onSelectCell={selectEdge}
          className="min-w-0"
        />
        <CollaborationDetailAside
          data={data}
          selectedNodeId={selectedNodeId}
          selectedEdgeKey={selectedEdgeKey}
          onClose={clearSelection}
          onSelectNode={selectNode}
          className="min-w-0 lg:sticky lg:top-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="flex min-h-0 flex-col gap-2 lg:col-span-2">
          <CollaborationRoleLegend
            roles={legendRoles}
            visibleRoleKeys={visibleRoleKeys}
            onToggleRole={(roleKey) => {
              setVisibleRoleKeys((prev) => {
                const next = new Set(prev)
                if (next.has(roleKey)) {
                  if (next.size <= 1) return prev
                  next.delete(roleKey)
                } else {
                  next.add(roleKey)
                }
                return next
              })
            }}
            onShowAll={() => setVisibleRoleKeys(new Set(legendRoles.map((r) => r.key)))}
            onHideAll={() => setVisibleRoleKeys(defaultVisibleRoleKeys(legendRoles))}
          />
          {visibleNodes.length === 0 ? (
            <div className="flex aspect-[88/58] w-full items-center justify-center rounded-xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
              Select at least one role to display the network.
            </div>
          ) : (
            <CollaborationNetworkGraph
              nodes={visibleNodes}
              edges={visibleEdges}
              selectedNodeId={selectedNodeId}
              selectedEdgeKey={selectedEdgeKey}
              onSelectNode={selectNode}
              onSelectEdge={selectEdge}
            />
          )}
        </div>

        <CollaborationInsightsPanel
          insights={data.insights}
          onSelectNode={selectNode}
          onSelectEdge={selectEdge}
          className="min-h-0 lg:col-start-3 lg:h-full"
        />
      </div>
    </div>
  )
}
