'use client'

import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { layoutPlannedLoggedBar } from '@/lib/ui/planned-logged-bar-layout'
import { cn } from '@/lib/utils'

export function PlannedLoggedProgressBar({
  plannedHours,
  loggedHours,
  overrunHours,
  className,
  trackClassName,
}: {
  plannedHours: number
  loggedHours: number
  overrunHours?: number
  className?: string
  trackClassName?: string
}) {
  const layout = layoutPlannedLoggedBar(plannedHours, loggedHours)
  const displayOverrunHours =
    overrunHours != null && overrunHours > 0
      ? overrunHours
      : layout.isOverrun
        ? Math.max(0, loggedHours - plannedHours)
        : 0

  const overrunTitle =
    displayOverrunHours > 0
      ? `${fmtHoursKpi(displayOverrunHours)} over plan (${fmtHoursKpi(plannedHours)} planned · ${fmtHoursKpi(loggedHours)} logged)`
      : undefined

  const markerLeft = layout.plannedMarkerPct ?? 0

  return (
    <div
      className={cn(
        'group/bar relative w-full rounded-full bg-muted/50',
        layout.isOverrun && 'cursor-help',
        trackClassName,
        className
      )}
      title={layout.isOverrun ? overrunTitle : undefined}
      role={layout.isOverrun ? 'img' : 'presentation'}
      aria-label={layout.isOverrun ? overrunTitle : undefined}
    >
      {layout.showPlannedTrack ? (
        <div
          className="absolute inset-y-0 left-0 w-full rounded-full bg-[var(--overview-metric-planned)] opacity-45"
          aria-hidden
        />
      ) : null}

      {layout.loggedWidthPct > 0 ? (
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--overview-metric-logged)]"
          style={{ width: `${layout.loggedWidthPct}%` }}
          aria-hidden
        />
      ) : null}

      {layout.isOverrun && layout.overrunWidthPct > 0 ? (
        <div
          className={cn(
            'absolute inset-y-0 rounded-r-full bg-destructive/45',
            'transition-colors duration-150',
            'group-hover/bar:bg-destructive/60'
          )}
          style={{
            left: `${markerLeft}%`,
            width: `${layout.overrunWidthPct}%`,
          }}
          aria-hidden
        />
      ) : null}

      {layout.plannedMarkerPct != null ? (
        <div
          className="absolute top-1/2 z-20 -translate-y-1/2"
          style={{ left: `${markerLeft}%` }}
        >
          {/* Wider hit target for hover + tooltip */}
          <div
            className={cn(
              'absolute top-1/2 left-1/2 h-5 w-4 -translate-x-1/2 -translate-y-1/2',
              'cursor-help rounded-sm'
            )}
            title={overrunTitle}
            aria-hidden
          />
          <div
            className={cn(
              'relative left-1/2 h-3.5 w-[3px] -translate-x-1/2 rounded-full bg-destructive',
              'shadow-[0_0_0_2px] shadow-destructive/35',
              'ring-1 ring-background/80',
              'transition-[transform,box-shadow] duration-150',
              'group-hover/bar:scale-y-125 group-hover/bar:shadow-[0_0_0_3px] group-hover/bar:shadow-destructive/50'
            )}
            aria-hidden
          />
        </div>
      ) : null}
    </div>
  )
}

export function PlannedLoggedBarLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-[0.7rem] text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-3">
        <span
          className="size-2 rounded-sm bg-[var(--overview-metric-planned)] opacity-50"
          aria-hidden
        />
        Planned
      </span>
      <span className="inline-flex items-center gap-3">
        <span
          className="size-2 rounded-sm bg-[var(--overview-metric-logged)]"
          aria-hidden
        />
        Logged
      </span>
      <span className="inline-flex items-center gap-3">
        <span
          className="h-2 w-2.5 rounded-sm bg-destructive/50 ring-1 ring-destructive"
          aria-hidden
        />
        Overrun
      </span>
    </div>
  );
}
