import { Suspense } from 'react'
import type { ReactNode } from 'react'

import { ProjectsRoutePendingShell } from '@/components/projects/_shared/projects-route-pending-shell'
import { ProjectsProgressChartSkeleton } from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsProjectDetailLoading } from '@/components/projects/overview/projects-project-detail-loading'

type ProjectsActivityLayoutProps = {
  children: ReactNode
  grid: ReactNode
  detail: ReactNode
}

export default function ProjectsActivityLayout({
  children,
  grid,
  detail,
}: ProjectsActivityLayoutProps) {
  return (
    <ProjectsRoutePendingShell>
      <div className="flex flex-col gap-6">
        {children}
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <div className="min-w-0">
            <Suspense fallback={<ProjectsProgressChartSkeleton />}>{grid}</Suspense>
          </div>
          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
            <Suspense fallback={<ProjectsProjectDetailLoading />}>{detail}</Suspense>
          </aside>
        </div>
      </div>
    </ProjectsRoutePendingShell>
  )
}
