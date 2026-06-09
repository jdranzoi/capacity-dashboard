'use client'

import { X, Link2 } from 'lucide-react'
import Link from 'next/link'

import { RoleBadge } from '@/components/ui/role-badge'
import { formatFragmentationSeverity } from '@/lib/format/fragmentation-display'
import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import { teamsCompositionPersonHref } from '@/lib/teams/composition/teams-composition-utils'
import { cn } from '@/lib/utils'
import type {
  NeighborLink,
  RoleDistributionSlice,
} from '@/lib/teams/collaboration/collaboration-ui-utils'
import type { CollaborationNode } from '@/lib/teams/collaboration/collaboration-types'

function MetricCell({
  label,
  value,
  href,
}: {
  label: string
  value: string | number
  href?: string
}) {
  const content = (
    <>
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-base font-semibold tabular-nums">
        <span>{value}</span>
        {href ? (
          <Link2
            className="size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </p>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}: ${value}. Opens team composition in a new tab.`}
        className="group rounded-lg bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
      >
        {content}
      </Link>
    )
  }

  return <div className="rounded-lg bg-muted/30 px-3 py-2">{content}</div>
}

export function CollaborationPersonDrawer({
  node,
  neighbors,
  distribution,
  monthKey,
  onClose,
  onSelectNode,
  className,
}: {
  node: CollaborationNode
  neighbors: NeighborLink[]
  distribution: RoleDistributionSlice[]
  monthKey: string
  onClose: () => void
  onSelectNode: (id: string) => void
  className?: string
}) {
  const topCollaborators = neighbors.slice(0, 6)

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className,
      )}
      data-slot="collaboration-person"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <RoleBadge roleKey={node.roleKey} className="text-sm">
            {node.name}
          </RoleBadge>
          <p className="text-[0.7rem] text-muted-foreground">
            {node.roleLabel}
            {node.zoneLabel ? ` · ${node.zoneLabel}` : ""}
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
        <MetricCell
          label="Projects"
          value={node.totalProjects}
          href={teamsCompositionPersonHref(node.name, monthKey)}
        />
        <MetricCell label="Collaboratorsss" value={node.collaborators} />
        <MetricCell
          label="Fragmentation"
          value={formatFragmentationSeverity(node.fragmentationSeverity)}
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
                style={{
                  width: `${slice.pct}%`,
                  backgroundColor: roleColorVar(slice.roleKey),
                }}
                title={`${slice.roleLabel}: ${slice.pct}%`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
            {distribution.map((slice) => (
              <RoleBadge key={slice.roleKey} roleKey={slice.roleKey}>
                {slice.roleLabel} {slice.pct}%
              </RoleBadge>
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
                  <RoleBadge
                    roleKey={link.node.roleKey}
                    className="min-w-0 flex-1"
                  >
                    {link.node.name}
                  </RoleBadge>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {link.sharedProjects} shared
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No collaborators this month.
          </p>
        )}
      </div>
    </div>
  );
}
