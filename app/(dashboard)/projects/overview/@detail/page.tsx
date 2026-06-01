import { Suspense } from 'react'

import { ProjectsProjectDetailBlock } from '@/components/projects/overview/projects-project-detail-block'
import { ProjectsProjectDetailLoading } from '@/components/projects/overview/projects-project-detail-loading'
import { parseProjectsRouteFilters } from '@/lib/projects/overview/projects-route-filters'

type ProjectsDetailSlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function ProjectsDetailSlotContent({
  searchParams,
}: ProjectsDetailSlotProps) {
  const raw = await searchParams
  const projectKey = parseProjectsRouteFilters(raw).projectKey
  const detailKey = projectKey ?? 'none'

  return (
    <Suspense key={detailKey} fallback={<ProjectsProjectDetailLoading />}>
      <ProjectsProjectDetailBlock searchParams={raw} />
    </Suspense>
  )
}

/** Parallel slot: project drill-down only — does not remount the list. */
export default function ProjectsOverviewDetailSlot({
  searchParams,
}: ProjectsDetailSlotProps) {
  return <ProjectsDetailSlotContent searchParams={searchParams} />
}
