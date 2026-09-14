import { connection } from 'next/server'

import { ProjectsActivityGridBody } from '@/components/projects/activity/projects-activity-grid-body'
import { SectionDataError } from '@/components/ui/section-data-states'
import { loadProjectsActivityPage } from '@/lib/projects/activity/load-projects-activity'
import {
  parseProjectsActivityRouteFilters,
  type ProjectsActivityListParams,
} from '@/lib/projects/activity/activity-route-filters'

export async function ProjectsActivityGridBlock({
  listParams,
}: {
  listParams: ProjectsActivityListParams
}) {
  await connection()
  const filters = parseProjectsActivityRouteFilters(listParams)
  const { data, error } = await loadProjectsActivityPage(filters)
  if (error) return <SectionDataError message={error} />
  if (!data) return <SectionDataError message="No month options available." />

  return <ProjectsActivityGridBody payload={data.payload} />
}
