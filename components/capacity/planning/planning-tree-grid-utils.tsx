'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { utilizationLoggedVsCapacityCellStyle } from '@/lib/capacity/shared/utilization-tone'
import { cn } from '@/lib/utils'

const GROUP_KINDS = new Set(['role', 'project'])

export function PlanningTreeNameCell({
  label,
  depth,
  kind,
  canExpand,
  isExpanded,
  onToggle,
}: {
  label: string
  depth: number
  kind: string
  canExpand: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  const isGroup = GROUP_KINDS.has(kind)

  return (
    <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: `${depth * 0.75}rem` }}>
      {canExpand ? (
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          onClick={onToggle}
        >
          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      ) : (
        <span className="inline-block size-5 shrink-0" aria-hidden />
      )}
      <span
        className={cn(
          'min-w-0 truncate text-foreground',
          isGroup ? 'font-medium' : 'font-normal text-foreground/90'
        )}
        title={label}
      >
        {label}
      </span>
    </div>
  )
}

export function PlanningMetricCell({
  value,
  tonePct,
  emphasizeOpen,
}: {
  value: ReactNode
  tonePct?: number | null
  emphasizeOpen?: boolean
}) {
  if (tonePct != null) {
    return (
      <span
        className="inline-block max-w-full min-w-11 truncate rounded-md px-1.5 py-0.5 text-right tabular-nums ring-1 ring-foreground/8"
        style={utilizationLoggedVsCapacityCellStyle(tonePct)}
      >
        {value}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'block truncate text-right tabular-nums text-[0.8125rem]',
        emphasizeOpen && 'font-medium text-emerald-600 dark:text-emerald-400'
      )}
    >
      {value}
    </span>
  )
}

export function fmtPlanningHours(value: number | null | undefined): string {
  if (value == null) return '—'
  return fmtHoursKpi(value)
}

export function fmtPlanningPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return fmtPct(value)
}

export const PLANNING_NAME_COL_CLASS = 'sticky left-0 z-20 min-w-[10rem] max-w-[14rem] bg-card text-left'
export const PLANNING_NAME_CELL_CLASS =
  'sticky left-0 z-[1] bg-card px-1.5 pt-1.5 pb-1'
export const PLANNING_METRIC_COL_CLASS = 'min-w-[3rem] max-w-[3.5rem]'
export const PLANNING_METRIC_CELL_CLASS = 'px-1 py-1.5 text-right'
