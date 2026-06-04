'use client'

import { X } from 'lucide-react'

import { CollaborationRoleDot } from '@/components/teams/collaboration/collaboration-role-dot'
import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import { cn } from '@/lib/utils'
import type {
  NeighborLink,
  RoleDistributionSlice,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type { CollaborationNode } from '@/lib/teams/collaboration/collaboration-types'

import { formatFragmentationFlagged } from '@/lib/format/fragmentation-display'

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function CollaborationPersonDrawer({
  node,
  neighbors,
  distribution,
  onClose,
  onSelectNode,
  className,
}: {
  node: CollaborationNode
  neighbors: NeighborLink[]
  distribution: RoleDistributionSlice[]
  onClose: () => void
  onSelectNode: (id: string) => void
  className?: string
}) {
  const topCollaborators = neighbors.slice(0, 6)

  return (
    <div
      className={cn('flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10', className)}
      data-slot="collaboration-person"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CollaborationRoleDot roleKey={node.roleKey} />
            <p className="truncate text-sm font-medium">{node.name}</p>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            {node.roleLabel}
            {node.zoneLabel ? ` · ${node.zoneLabel}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close person detail"
          className="rounded-md p-0.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricCell label="Projects" value={node.totalProjects} />
        <MetricCell label="Collaborators" value={node.collaborators} />
        <MetricCell
          label="Fragmentation"
          value={formatFragmentationFlagged(node.fragmentationFlagged)}
        />
      </div>

      {distribution.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            Collaboration by role
          </p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
            {distribution.map((slice) => (
              <span
                key={slice.roleKey}
                className="h-full"
                style={{ width: `${slice.pct}%`, backgroundColor: roleColorVar(slice.roleKey) }}
                title={`${slice.roleLabel}: ${slice.pct}%`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
            {distribution.map((slice) => (
              <span key={slice.roleKey} className="flex items-center gap-1.5">
                <CollaborationRoleDot roleKey={slice.roleKey} />
                {slice.roleLabel} {slice.pct}%
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Top collaborators
        </p>
        {topCollaborators.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {topCollaborators.map((link) => (
              <li key={link.node.id}>
                <button
                  type="button"
                  onClick={() => onSelectNode(link.node.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md bg-muted/20 px-2.5 py-1.5 text-xs hover:bg-muted/50"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <CollaborationRoleDot roleKey={link.node.roleKey} />
                    <span className="truncate">{link.node.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {link.sharedProjects} shared
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No collaborators this month.</p>
        )}
      </div>
    </div>
  )
}
