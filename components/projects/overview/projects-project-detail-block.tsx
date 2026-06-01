import { connection } from 'next/server'

import { ProjectsDataError } from '@/components/projects/_shared/projects-data-error'
import { ProjectsProjectDetailPanelWithNav } from '@/components/projects/overview/projects-project-detail-panel-client'
import { ProjectsProjectDetailEmpty } from '@/components/projects/overview/projects-project-detail-empty'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadProjectDetailPanel } from '@/lib/projects/overview/load-project-detail-panel'
import { getProjectsMonthContext } from '@/lib/projects/overview/projects-page-cache'
import { parseProjectsRouteFilters } from '@/lib/projects/overview/projects-route-filters'

export async function ProjectsProjectDetailBlock({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return perfSpan('projects/overview/detail', async () => {
    await connection()
    const routeFilters = parseProjectsRouteFilters(searchParams)

    if (!routeFilters.projectKey) {
      return <ProjectsProjectDetailEmpty />
    }

    const monthParam = searchParams.month
    const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

    const monthCtxRes = await getProjectsMonthContext(monthStr)
    if (monthCtxRes.error) {
      return <ProjectsDataError message={`Could not load month context: ${monthCtxRes.error}`} />
    }
    if (!monthCtxRes.data) {
      return <ProjectsProjectDetailEmpty />
    }

    const detailRes = await loadProjectDetailPanel({
      projectKey: routeFilters.projectKey,
      viewMode: routeFilters.view,
      monthContext: monthCtxRes.data,
    })

    if (detailRes.error) {
      return <ProjectsDataError message={`Could not load project detail: ${detailRes.error}`} />
    }
    if (!detailRes.data) {
      return <ProjectsProjectDetailEmpty />
    }

    return <ProjectsProjectDetailPanelWithNav detail={detailRes.data} />
  })
}
