import { connection } from 'next/server'

import {
  ProjectsDataError,
  ProjectsEmptyMonths,
} from '@/components/projects/_shared/projects-data-error'
import { ProjectsOverviewGridBody } from '@/components/projects/overview/projects-overview-grid-body'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadProjectsOverviewGlobal } from '@/lib/projects/overview/load-projects-global-list'
import { loadProjectsOverviewMonthly } from '@/lib/projects/overview/load-projects-overview-list'
import type { ProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import { getProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'
import {
  pickRecentMonthOptions,
  usesProjectsProgressMonthPicker,
} from '@/lib/projects/overview/projects-progress-month-options'
import { parseProjectsRouteFilters } from '@/lib/projects/overview/projects-route-filters'

export async function ProjectsOverviewGridBlock({
  listParams,
}: {
  listParams: ProjectsListSearchParams
}) {
  return perfSpan('projects/overview/grid', async () => {
    await connection()

    const routeFilters = parseProjectsRouteFilters({
      month: listParams.month,
      view: listParams.view,
      category: listParams.category,
      q: listParams.q,
    })

    const monthCtxRes = await getProjectsMonthContext(
      listParams.month,
      routeFilters.category
    )

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
            fallbackSnapshotId: monthCtxRes.data.snapshot.id,
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

    const showMonthPicker = usesProjectsProgressMonthPicker(routeFilters.category)
    const progressMonthOptions = showMonthPicker
      ? pickRecentMonthOptions(monthCtxRes.data.options)
      : []

    return (
      <ProjectsOverviewGridBody
        payload={listRes.data}
        category={routeFilters.category}
        showMonthPicker={showMonthPicker}
        monthOptions={progressMonthOptions}
        selectedMonthKey={monthCtxRes.data.selected.monthKey}
      />
    )
  })
}
