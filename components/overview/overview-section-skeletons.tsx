import { Skeleton } from '@/components/ui/skeleton'
import { OVERVIEW_METRIC_ROWS } from '@/lib/overview/overview-metrics'

export function OverviewToolbarSkeleton() {
  return (
    <div className="space-y-3 border-b border-border/80 pb-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[11.5rem] flex-col gap-1">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-16 min-w-[200px] flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export function OverviewKpiCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-full" />
    </div>
  )
}

export function OverviewKpiRowSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch xl:grid-cols-5">
      {OVERVIEW_METRIC_ROWS.map((row) => (
        <OverviewKpiCardSkeleton key={row.key} />
      ))}
    </div>
  )
}

export function OverviewChartsRowSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[min(28rem,52vh)]">
      <Skeleton className="h-72 rounded-xl lg:col-span-4" />
      <Skeleton className="h-72 rounded-xl lg:col-span-3" />
      <Skeleton className="h-72 rounded-xl lg:col-span-3" />
      <Skeleton className="h-72 rounded-xl lg:col-span-2" />
    </div>
  )
}

export function OverviewWeeklyDetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[min(32rem,58vh)]">
      <Skeleton className="h-80 rounded-xl lg:col-span-7" />
      <Skeleton className="h-80 rounded-xl lg:col-span-5" />
    </div>
  )
}

/** Full page fallback when the route has no streamed sections yet. */
export function WeeklyHeadlineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewToolbarSkeleton />
      <OverviewKpiRowSkeleton />
      <OverviewChartsRowSkeleton />
      <OverviewWeeklyDetailSkeleton />
    </div>
  )
}
