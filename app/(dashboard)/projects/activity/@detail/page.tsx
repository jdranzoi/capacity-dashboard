import { Suspense } from 'react'

import { ProjectsActivityDetailBlock } from '@/components/projects/activity/projects-activity-detail-block'
import { ProjectsProjectDetailLoading } from '@/components/projects/overview/projects-project-detail-loading'
import { parseProjectsActivityRouteFilters } from '@/lib/projects/activity/activity-route-filters'

type ProjectsActivityDetailSlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProjectsActivityDetailSlot({
  searchParams,
}: ProjectsActivityDetailSlotProps) {
  const raw = await searchParams
  const projectKey = parseProjectsActivityRouteFilters(raw).projectKey
  const detailKey = projectKey ?? 'none'

  return (
    <Suspense key={detailKey} fallback={<ProjectsProjectDetailLoading />}>
      <ProjectsActivityDetailBlock searchParams={raw} />
    </Suspense>
  )
}
