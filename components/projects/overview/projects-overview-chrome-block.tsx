import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { ProjectsOverviewToolbar } from '@/components/projects/overview/projects-overview-toolbar'
import { perfSpan } from '@/lib/dev/perf-log'
import type { ProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import {
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
      q: listParams.q,
    })

    return (
      <DashboardSectionHeader
        title="Projects overview"
        subtitle="High-level delivery performance across active projects"
        filters={
          <ProjectsOverviewToolbar
            category={routeFilters.category}
            searchQuery={routeFilters.searchQuery}
          />
        }
      />
    )
  })
}

export type { ProjectsRouteFilters }
