import { Suspense } from 'react'
import type { ReactNode } from 'react'

import { ProjectsRoutePendingShell } from '@/components/projects/_shared/projects-route-pending-shell'
import { ProjectsProgressChartSkeleton } from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsProjectDetailLoading } from '@/components/projects/overview/projects-project-detail-loading'

type ProjectsOverviewLayoutProps = {
  children: ReactNode
  grid: ReactNode
  detail: ReactNode
}

/**
 * Full-width chrome + KPIs in `children` (page).
 * Progress grid and project detail share the row below (50% / 50%).
 */
export default function ProjectsOverviewLayout({
  children,
  grid,
  detail,
}: ProjectsOverviewLayoutProps) {
  return (
    <ProjectsRoutePendingShell>
      <div className="flex flex-col gap-6">
        {children}
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <div className="min-w-0">
            <Suspense fallback={<ProjectsProgressChartSkeleton />}>
              {grid}
            </Suspense>
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <Suspense fallback={<ProjectsProjectDetailLoading />}>
              {detail}
            </Suspense>
          </aside>
        </div>
      </div>
    </ProjectsRoutePendingShell>
  );
}
