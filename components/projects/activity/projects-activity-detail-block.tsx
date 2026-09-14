import { connection } from 'next/server'

import { ProjectsProjectDetailPanelWithNav } from '@/components/projects/overview/projects-project-detail-panel-client'
import { ProjectsProjectDetailEmpty } from '@/components/projects/overview/projects-project-detail-empty'
import { SectionDataError } from '@/components/ui/section-data-states'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import { activityProjectTypeLabel } from '@/lib/domain/project-types'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import {
  getActivityMonthContext,
  loadProjectsActivityPage,
} from '@/lib/projects/activity/load-projects-activity'
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

  const listRes = await loadProjectsActivityPage({ ...filters, type: 'all' })
  const listRow = listRes.data?.payload.groups
    .flatMap((group) => group.rows)
    .find((row) => row.projectKey === filters.projectKey)

  if (listRow && !listRow.hasDeliveryDetail) {
    return (
      <DataSectionPanel dataSlot="projects-activity-detail" className="gap-3">
        <DataSectionPanelHeader
          title={listRow.projectName ? `${listRow.projectKey} · ${listRow.projectName}` : listRow.projectKey}
          description={`${activityProjectTypeLabel(listRow.projectType)} · ${listRow.status}`}
        />
        <p className="text-xs text-muted-foreground">
          Delivery detail is available for build, support, product, and internal projects.
          This row logged {fmtHoursKpi(listRow.loggedHours)} in {monthCtx.data.monthLabel}.
        </p>
      </DataSectionPanel>
    )
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
