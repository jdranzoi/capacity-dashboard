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
      className={cn('gap-4', className)}
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
      className={cn('space-y-2', className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-1 h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-[4.5rem] shrink-0 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  )
}
