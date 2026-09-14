import { Suspense } from 'react'
import { connection } from 'next/server'

import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { ProjectsPageSkeleton } from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsActivityChromeBlock } from '@/components/projects/activity/projects-activity-chrome-block'
import {
  activityListSlotKey,
  pickActivityListSearchParams,
} from '@/lib/projects/activity/activity-route-filters'

type ProjectsActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function ProjectsActivityPage({ searchParams }: ProjectsActivityPageProps) {
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsActivityMainSlot searchParams={searchParams} />
    </Suspense>
  )
}

async function ProjectsActivityMainSlot({ searchParams }: ProjectsActivityPageProps) {
  await connection()
  const listParams = pickActivityListSearchParams(await searchParams)
  const listSlotKey = activityListSlotKey(listParams)

  return (
    <Suspense key={`chrome-${listSlotKey}`} fallback={<DashboardSectionHeaderSkeleton filterCount={2} />}>
      <ProjectsActivityChromeBlock listParams={listParams} />
    </Suspense>
  )
}
