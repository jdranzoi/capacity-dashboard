import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { ProjectsOverviewToolbar } from '@/components/projects/overview/projects-overview-toolbar'
import { SectionDataError } from '@/components/ui/section-data-states'
import { loadProjectTypes } from '@/lib/data/load-project-types'
import { presentProjectTypes } from '@/lib/domain/project-types'
import { loadProjects } from '@/lib/projects/overview/load-projects'
import { perfSpan } from '@/lib/dev/perf-log'
import type { ProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import {
  matchesProjectsStatus,
  parseProjectsRouteFilters,
  type ProjectsRouteFilters,
} from '@/lib/projects/overview/projects-route-filters'

export async function ProjectsOverviewChromeBlock({
  listParams,
}: {
  listParams: ProjectsListSearchParams
}) {
  return perfSpan('projects/overview/chrome', async () => {
    await connection()
    const routeFilters = parseProjectsRouteFilters({
      month: listParams.month,
      view: listParams.view,
      category: listParams.category,
      status: listParams.status,
      q: listParams.q,
    })

    const [typesRes, projectsRes] = await Promise.all([loadProjectTypes(), loadProjects()])
    const loadError = typesRes.error ?? projectsRes.error
    if (loadError) {
      return <SectionDataError message={`Could not load project types: ${loadError}`} />
    }
    const typeOptions = presentProjectTypes(
      typesRes.types,
      [
        routeFilters.category,
        ...projectsRes.rows
          .filter((project) => matchesProjectsStatus(project.status, routeFilters.status))
          .map((project) => project.project_type),
      ]
    )

    return (
      <DashboardSectionHeader
        title="Projects overview"
        subtitle="High-level delivery performance by project type and status"
        filters={
          <ProjectsOverviewToolbar
            category={routeFilters.category}
            typeOptions={typeOptions}
            status={routeFilters.status}
            searchQuery={routeFilters.searchQuery}
          />
        }
      />
    )
  })
}

export type { ProjectsRouteFilters }
