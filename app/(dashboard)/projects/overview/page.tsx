import { Suspense } from 'react'
import { connection } from 'next/server'

import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import {
  ProjectsKpiRowSkeleton,
  ProjectsPageSkeleton,
} from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsOverviewChromeBlock } from '@/components/projects/overview/projects-overview-chrome-block'
import { ProjectsOverviewKpiBlock } from '@/components/projects/overview/projects-overview-kpi-block'
import { pickProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import { projectsListSlotKey } from '@/lib/projects/overview/projects-list-slot-key'

type ProjectsOverviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function ProjectsOverviewPage({ searchParams }: ProjectsOverviewPageProps) {
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsOverviewMainSlot searchParams={searchParams} />
    </Suspense>
  )
}

async function ProjectsOverviewMainSlot({
  searchParams,
}: ProjectsOverviewPageProps) {
  await connection()
  const raw = await searchParams
  const listParams = pickProjectsListSearchParams(raw)
  const listSlotKey = projectsListSlotKey(listParams)

  return (
    <>
      <Suspense key={`chrome-${listSlotKey}`} fallback={<DashboardSectionHeaderSkeleton filterCount={2} />}>
        <ProjectsOverviewChromeBlock listParams={listParams} />
      </Suspense>

      <Suspense key={`kpi-${listSlotKey}`} fallback={<ProjectsKpiRowSkeleton />}>
        <ProjectsOverviewKpiBlock listParams={listParams} />
      </Suspense>
    </>
  )
}
