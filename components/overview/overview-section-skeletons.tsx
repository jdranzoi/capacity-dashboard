import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { OVERVIEW_METRIC_ROWS } from '@/lib/overview/overview-metrics'

export function OverviewToolbarSkeleton() {
  return <DashboardSectionHeaderSkeleton />
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
    <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch lg:min-h-[min(28rem,52vh)]">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl lg:col-span-2" />
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
    </div>
  )
}
