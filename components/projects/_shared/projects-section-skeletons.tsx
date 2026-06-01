import { KPI_METRICS_GRID_CLASS } from '@/components/dashboard/kpi-metric-card'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'

export function ProjectsPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton filterCount={2} />
      <ProjectsKpiRowSkeleton />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProjectsProgressChartSkeleton />
        <Skeleton className={cn(dashboardSurfaceClass('h-[24rem]'))} />
      </div>
    </div>
  )
}

export function ProjectsKpiRowSkeleton() {
  return (
    <div className={cn(KPI_METRICS_GRID_CLASS, 'xl:grid-cols-6')}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={cn(dashboardSurfaceClass('h-[5.5rem]'))} />
      ))}
    </div>
  )
}

export function ProjectsProgressChartSkeleton() {
  return <Skeleton className={cn(dashboardSurfaceClass('h-[28rem]'))} />
}
