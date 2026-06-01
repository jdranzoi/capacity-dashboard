import type { ProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'

/** Stable key for main-slot Suspense — excludes `project` drill-down param. */
export function projectsListSlotKey(listParams: ProjectsListSearchParams): string {
  return [listParams.month ?? '', listParams.view ?? '', listParams.category ?? '', listParams.q ?? ''].join(
    '|'
  )
}
