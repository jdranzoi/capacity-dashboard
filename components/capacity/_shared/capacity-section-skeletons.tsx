import { CapacityPlanningAvailablePeopleLoading } from '@/components/capacity/planning/capacity-planning-available-people-loading'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { DASHBOARD_SURFACE } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

export function CapacityKpiRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CapacityOpsKpiSkeleton() {
  return (
    <div className="grid items-stretch gap-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="flex h-full flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {Array.from({ length: col === 0 ? 4 : 3 }).map((_, i) => (
              <div key={i} className={cn(DASHBOARD_SURFACE, 'flex flex-1 flex-col justify-center px-3 py-2')}>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-1 h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function UtilizationAnalyticsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className={cn(DASHBOARD_SURFACE, "h-72")} />
      <Skeleton className={cn(DASHBOARD_SURFACE, "h-72")} />
      <Skeleton className={cn(DASHBOARD_SURFACE, "h-96 lg:col-span-2")} />
    </div>
  );
}

/** Table body placeholder when staffing loads inside the analytics panel. */
export function UtilizationStaffingSkeleton() {
  return <Skeleton className="h-96 w-full rounded-lg" />
}

export function UtilizationPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton filterCount={4} />
      <CapacityOpsKpiSkeleton />
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <UtilizationAnalyticsSkeleton />
      </section>
    </div>
  )
}

export function CapacityChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-xl border border-border" />
      <Skeleton className="h-80 rounded-xl border border-border" />
    </div>
  );
}

export function CapacityRoleSummarySkeleton() {
  return <Skeleton className="h-64 rounded-xl border border-border" />
}

export function CapacityYearGridSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className={cn(DASHBOARD_SURFACE, 'h-80')} />
      ))}
    </div>
  )
}

/** Month x KPI matrix on Capacity Overview. */
export function CapacityYearMatrixSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className={cn(DASHBOARD_SURFACE, 'h-[22rem] w-full')} />
    </div>
  )
}

export function CapacityPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardSectionHeaderSkeleton />
      <CapacityYearMatrixSkeleton />
      <CapacityYearGridSkeleton />
      <CapacityChartsSkeleton />
      <CapacityRoleSummarySkeleton />
    </div>
  );
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
    <div className="flex flex-col gap-6">
      <CapacityPlanningChromeSkeleton />
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <CapacityPlanningGridSkeleton />
        </div>
        <div className="flex flex-col gap-3 xl:col-span-3">
          <CapacityPlanningAvailablePeopleSkeleton />
          <CapacityPlanningUpcomingSkeleton />
        </div>
      </div>
    </div>
  );
}
