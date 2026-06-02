import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Mirrors the Available People card so Suspense shows where results will appear. */
export function CapacityPlanningAvailablePeopleLoading({
  className,
  listOnly = false,
}: {
  className?: string
  /** When true, only the results list area (for in-card transition loading). */
  listOnly?: boolean
}) {
  if (listOnly) {
    return (
      <AvailablePeopleListSkeleton
        className={className}
        aria-label="Loading available people"
      />
    )
  }

  return (
    <DataSectionPanel
      dataSlot="capacity-planning-available-people"
      className={cn('gap-3', className)}
      aria-busy
      aria-label="Loading available people"
    >
      <DataSectionPanelHeader
        title="Available People"
        description="Identify open capacity for staffing decisions."
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ))}
      </div>

      <AvailablePeopleListSkeleton />
    </DataSectionPanel>
  )
}

function AvailablePeopleListSkeleton({
  className,
  'aria-label': ariaLabel,
}: {
  className?: string
  'aria-label'?: string
}) {
  return (
    <ul
      className={cn('space-y-1', className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="rounded-md border border-border/70 bg-muted/10 px-2.5 py-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}
