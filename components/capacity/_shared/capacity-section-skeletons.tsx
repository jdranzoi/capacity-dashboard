import { CapacityPlanningAvailablePeopleLoading } from '@/components/capacity/planning/capacity-planning-available-people-loading'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { DASHBOARD_SURFACE } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

export function CapacityKpiRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function UtilizationKpiRowSkeleton() {
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

export function UtilizationAnalyticsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-72')} />
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-72')} />
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-96 lg:col-span-2')} />
    </div>
  )
}

/** Table body placeholder when staffing loads inside the analytics panel. */
export function UtilizationStaffingSkeleton() {
  return <Skeleton className="h-96 w-full rounded-lg" />
}

export function UtilizationPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton filterCount={4} />
      <UtilizationKpiRowSkeleton />
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <UtilizationAnalyticsSkeleton />
      </section>
    </div>
  )
}

export function CapacityChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-xl border border-border" />
      <Skeleton className="h-80 rounded-xl border border-border" />
    </div>
  )
}

export function CapacityRoleSummarySkeleton() {
  return <Skeleton className="h-64 rounded-xl border border-border" />
}

export function CapacityPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton />
      <CapacityKpiRowSkeleton />
      <CapacityChartsSkeleton />
      <CapacityRoleSummarySkeleton />
    </div>
  )
}

export function CapacityPlanningChromeSkeleton() {
  return (
    <>
      <DashboardSectionHeaderSkeleton filterCount={2} />
      <CapacityKpiRowSkeleton count={4} />
    </>
  )
}

export function CapacityPlanningGridSkeleton() {
  return <Skeleton className={cn(DASHBOARD_SURFACE, 'h-[28rem] w-full')} />
}

export function CapacityPlanningAvailablePeopleSkeleton() {
  return <CapacityPlanningAvailablePeopleLoading />
}

export function CapacityPlanningUpcomingSkeleton() {
  return <Skeleton className={cn(DASHBOARD_SURFACE, 'h-56 w-full')} />
}

export function CapacityPlanningPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <CapacityPlanningChromeSkeleton />
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <CapacityPlanningGridSkeleton />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-3">
          <CapacityPlanningAvailablePeopleSkeleton />
          <CapacityPlanningUpcomingSkeleton />
        </div>
      </div>
    </div>
  )
}
