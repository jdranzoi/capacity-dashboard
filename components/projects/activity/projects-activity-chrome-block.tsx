import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { ProjectsActivityToolbar } from '@/components/projects/activity/projects-activity-toolbar'
import { SectionDataError } from '@/components/ui/section-data-states'
import { fmtHeadcountKpi, fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { loadProjectsActivityPage } from '@/lib/projects/activity/load-projects-activity'
import type { ProjectsActivityListParams } from '@/lib/projects/activity/activity-route-filters'
import { parseProjectsActivityRouteFilters } from '@/lib/projects/activity/activity-route-filters'

export async function ProjectsActivityChromeBlock({
  listParams,
}: {
  listParams: ProjectsActivityListParams
}) {
  await connection()
  const filters = parseProjectsActivityRouteFilters(listParams)
  const { data, error } = await loadProjectsActivityPage(filters)
  if (error) return <SectionDataError message={error} />
  if (!data) return <SectionDataError message="No month options available." />

  const { payload, monthOptions } = data

  return (
    <DashboardSectionHeader
      title="Project activity"
      subtitle={`Projects with logged hours in ${payload.monthLabel} — ${fmtHeadcountKpi(payload.totalCount)} projects, ${fmtHoursKpi(payload.totalLoggedHours)}. Same population as Capacity Overview Projects.`}
      filters={
        <ProjectsActivityToolbar
          monthOptions={monthOptions}
          monthKey={payload.monthKey}
          typeFilter={payload.typeFilter}
          typeOptions={payload.typeOptions}
        />
      }
    />
  )
}
