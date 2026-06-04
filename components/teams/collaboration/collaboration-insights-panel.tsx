'use client'

import { collaborationEdgeKey } from '@/lib/teams/collaboration/collaboration-ui-utils'
import { cn } from '@/lib/utils'
import type { CollaborationInsights } from '@/lib/teams/collaboration/collaboration-types'

function InsightRow({
  label,
  primary,
  secondary,
  onSelect,
}: {
  label: string
  primary: string
  secondary: string
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      disabled={!onSelect}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left',
        onSelect ? 'cursor-pointer hover:bg-muted/40' : 'cursor-default'
      )}
    >
      <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-sm font-medium">{primary}</span>
      <span className="text-[0.72rem] text-muted-foreground">{secondary}</span>
    </button>
  )
}

export function CollaborationInsightsPanel({
  insights,
  onSelectNode,
  onSelectEdge,
  className,
}: {
  insights: CollaborationInsights
  onSelectNode: (id: string) => void
  onSelectEdge: (key: string) => void
  className?: string
}) {
  const pair = insights.strongestPmTlPair
  const frag = insights.highestFragmentation
  const tl = insights.mostConnectedTl

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10',
        className
      )}
      data-slot="collaboration-insights"
    >
      <h3 className="mb-2 shrink-0 text-sm font-medium">Insights</h3>
      <div className="flex flex-col divide-y divide-border">
        <InsightRow
          label="Strongest PM ↔ TL"
          primary={pair ? `${pair.pm.name} ↔ ${pair.tl.name}` : '—'}
          secondary={pair ? `${pair.sharedProjects} shared projects` : 'No PM/TL pair'}
          onSelect={
            pair ? () => onSelectEdge(collaborationEdgeKey(pair.pm.id, pair.tl.id)) : undefined
          }
        />
        <InsightRow
          label="Highest fragmentation"
          primary={frag ? frag.name : '—'}
          secondary={
            frag
              ? `${frag.totalCount} concurrent · ${frag.flagged ? 'Yes' : 'No'}`
              : 'No fragmentation row for anchor month'
          }
          onSelect={frag ? () => onSelectNode(frag.id) : undefined}
        />
        <InsightRow
          label="Most connected TL"
          primary={tl ? tl.name : '—'}
          secondary={tl ? `${tl.connections} collaborators` : 'No Technical Lead activity'}
          onSelect={tl ? () => onSelectNode(tl.id) : undefined}
        />
        <InsightRow
          label="Isolated resources"
          primary={`${insights.isolatedResources}`}
          secondary="People with one connection or fewer"
        />
        <InsightRow
          label="Most stable squad"
          primary="—"
          secondary="Squad detection — future iteration"
        />
      </div>
    </div>
  )
}
