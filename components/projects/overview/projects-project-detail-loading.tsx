import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'

export function ProjectsProjectDetailLoading() {
  return (
    <DataSectionPanel
      dataSlot="projects-overview-detail"
      className="gap-3"
      aria-busy
      aria-label="Loading project detail"
    >
      <DataSectionPanelHeader
        title="Project detail"
        description="Loading delivery metrics…"
      />

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(dashboardSurfaceClass("h-12 w-full"))}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </DataSectionPanel>
  );
}
