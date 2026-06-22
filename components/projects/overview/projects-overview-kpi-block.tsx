import { connection } from 'next/server'

import {
  PROJECTS_EMPTY_MONTHS_MESSAGE,
  SectionDataError,
  SectionEmptyState,
} from '@/components/ui/section-data-states'
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
      pm: listParams.pm,
    })

    const monthCtxRes = await getProjectsMonthContext(
      listParams.month,
      routeFilters.category
    )
    if (monthCtxRes.error) {
      return <SectionDataError message={`Could not load month context: ${monthCtxRes.error}`} />
    }
    if (!monthCtxRes.data) {
      return <SectionEmptyState message={PROJECTS_EMPTY_MONTHS_MESSAGE} />
    }

    const listRes =
      routeFilters.view === 'global'
        ? await loadProjectsOverviewGlobal({
            anchorMonthStartStr: monthCtxRes.data.monthStartStr,
            category: routeFilters.category,
            searchQuery: routeFilters.searchQuery,
            fallbackSnapshotId: monthCtxRes.data.snapshot.id,
          })
        : await loadProjectsOverviewMonthly({
            monthContext: monthCtxRes.data,
            category: routeFilters.category,
            searchQuery: routeFilters.searchQuery,
            pmQuery: routeFilters.pmQuery,
          })

    if (listRes.error) {
      return <SectionDataError message={`Could not load projects: ${listRes.error}`} />
    }
    if (!listRes.data) {
      return <SectionEmptyState message={PROJECTS_EMPTY_MONTHS_MESSAGE} />
    }

    return (
      <ProjectsOverviewKpiSection
        kpis={listRes.data.kpis}
        viewMode={listRes.data.viewMode}
      />
    )
  })
}
