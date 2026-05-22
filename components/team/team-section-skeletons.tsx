import { Skeleton } from '@/components/ui/skeleton'
import { DASHBOARD_SURFACE } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

export function TeamToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5">
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex min-w-[7.5rem] flex-col gap-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function TeamKpiRowSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn(DASHBOARD_SURFACE, 'p-3')}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-8 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TeamAnalyticsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-72')} />
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-72')} />
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-96 lg:col-span-2')} />
    </div>
  )
}

/** Table body placeholder when staffing loads inside the analytics panel. */
export function TeamStaffingSkeleton() {
  return <Skeleton className="h-96 w-full rounded-lg" />
}

export function TeamPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1 border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
        </div>
      </div>
      <TeamToolbarSkeleton />
      <TeamKpiRowSkeleton />
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <TeamAnalyticsSkeleton />
      </section>
    </div>
  )
}
