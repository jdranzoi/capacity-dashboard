import { connection } from 'next/server'

import {
  ProjectsDataError,
  ProjectsEmptyMonths,
} from '@/components/projects/_shared/projects-data-error'
import { ProjectsOverviewKpiSection } from '@/components/projects/overview/projects-overview-kpi-section'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadProjectsOverviewGlobal } from '@/lib/projects/overview/load-projects-global-list'
import { loadProjectsOverviewMonthly } from '@/lib/projects/overview/load-projects-overview-list'
import type { ProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import { getProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'
import { parseProjectsRouteFilters } from '@/lib/projects/overview/projects-route-filters'

export async function ProjectsOverviewKpiBlock({
  listParams,
}: {
  listParams: ProjectsListSearchParams
}) {
  return perfSpan('projects/overview/kpi', async () => {
    await connection()

    const routeFilters = parseProjectsRouteFilters({
      month: listParams.month,
      view: listParams.view,
      category: listParams.category,
      q: listParams.q,
    })

    const monthCtxRes = await getProjectsMonthContext(listParams.month)
    if (monthCtxRes.error) {
      return <ProjectsDataError message={`Could not load month context: ${monthCtxRes.error}`} />
    }
    if (!monthCtxRes.data) {
      return <ProjectsEmptyMonths />
    }

    const listRes =
      routeFilters.view === 'global'
        ? await loadProjectsOverviewGlobal({
            anchorMonthStartStr: monthCtxRes.data.monthStartStr,
            category: routeFilters.category,
            searchQuery: routeFilters.searchQuery,
          })
        : await loadProjectsOverviewMonthly({
            monthContext: monthCtxRes.data,
            category: routeFilters.category,
            searchQuery: routeFilters.searchQuery,
          })

    if (listRes.error) {
      return <ProjectsDataError message={`Could not load projects: ${listRes.error}`} />
    }
    if (!listRes.data) {
      return <ProjectsEmptyMonths />
    }

    return (
      <ProjectsOverviewKpiSection
        kpis={listRes.data.kpis}
        viewMode={listRes.data.viewMode}
      />
    )
  })
}
