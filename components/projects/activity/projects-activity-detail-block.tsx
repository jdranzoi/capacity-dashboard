import { connection } from 'next/server'

import { ProjectsProjectDetailPanelWithNav } from '@/components/projects/overview/projects-project-detail-panel-client'
import { ProjectsProjectDetailEmpty } from '@/components/projects/overview/projects-project-detail-empty'
import { SectionDataError } from '@/components/ui/section-data-states'
import { getActivityMonthContext } from '@/lib/projects/activity/load-projects-activity'
import { parseProjectsActivityRouteFilters } from '@/lib/projects/activity/activity-route-filters'
import { loadProjectDetailPanel } from '@/lib/projects/overview/load-project-detail-panel'

export async function ProjectsActivityDetailBlock({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await connection()
  const filters = parseProjectsActivityRouteFilters(searchParams)
  if (!filters.projectKey) {
    return (
      <ProjectsProjectDetailEmpty description="Select a project from the list to view delivery metrics for this month." />
    )
  }

  const monthCtx = await getActivityMonthContext(filters.monthKey ?? undefined)
  if (monthCtx.error) {
    return <SectionDataError message={`Could not load month context: ${monthCtx.error}`} />
  }
  if (!monthCtx.data) {
    return <ProjectsProjectDetailEmpty />
  }

  const detailRes = await loadProjectDetailPanel({
    projectKey: filters.projectKey,
    viewMode: 'monthly',
    monthContext: monthCtx.data,
  })

  if (detailRes.error) {
    return <SectionDataError message={`Could not load project detail: ${detailRes.error}`} />
  }
  if (!detailRes.data) {
    return <ProjectsProjectDetailEmpty />
  }

  return <ProjectsProjectDetailPanelWithNav detail={detailRes.data} />
}
