import { BUILD_PROJECT_TYPE } from '@/lib/domain/project-types'

export type ProjectsViewMode = 'monthly' | 'global'

/** A `dim_project_type` key. */
export type ProjectsCategoryFilter = string

export const DEFAULT_PROJECTS_CATEGORY: ProjectsCategoryFilter = BUILD_PROJECT_TYPE

/** `active` lists live projects only; `all` adds closed, completed and cancelled ones. */
export type ProjectsStatusFilter = 'active' | 'all'

export const DEFAULT_PROJECTS_STATUS: ProjectsStatusFilter = 'active'

export const PROJECTS_STATUS_OPTIONS: readonly { value: ProjectsStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
]

export type ProjectsRouteFilters = {
  view: ProjectsViewMode
  category: ProjectsCategoryFilter
  status: ProjectsStatusFilter
  searchQuery: string | null
  projectKey: string | null
  pmQuery: string | null
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined
  return Array.isArray(value) ? value[0] : value
}

/** Build → global lifetime window. All other categories → monthly window. */
export function coerceViewForCategory(
  category: ProjectsCategoryFilter,
  view: ProjectsViewMode
): ProjectsViewMode {
  if (category === BUILD_PROJECT_TYPE) return 'global'
  return 'monthly'
}

export function parseProjectsRouteFilters(
  raw: Record<string, string | string[] | undefined>
): ProjectsRouteFilters {
  const viewRaw = firstParam(raw.view)?.toLowerCase()
  const requestedView: ProjectsViewMode =
    viewRaw === 'monthly' ? 'monthly' : 'global'

  const categoryRaw = firstParam(raw.category)?.trim().toLowerCase()
  const category: ProjectsCategoryFilter = categoryRaw || DEFAULT_PROJECTS_CATEGORY
  const status: ProjectsStatusFilter =
    firstParam(raw.status)?.toLowerCase() === 'all' ? 'all' : DEFAULT_PROJECTS_STATUS

  const view = coerceViewForCategory(category, requestedView)

  const q = firstParam(raw.q)?.trim()
  const project = firstParam(raw.project)?.trim()
  const pm = firstParam(raw.pm)?.trim()

  return {
    view,
    category,
    status,
    searchQuery: q && q.length > 0 ? q : null,
    projectKey: project && project.length > 0 ? project : null,
    pmQuery: pm && pm.length > 0 ? pm : null,
  }
}

export function matchesProjectsCategory(
  projectType: string,
  category: ProjectsCategoryFilter
): boolean {
  return projectType === category
}

export function matchesProjectsStatus(
  projectStatus: string,
  filter: ProjectsStatusFilter
): boolean {
  return filter === 'all' || projectStatus === 'active'
}

export function matchesProjectsSearch(
  projectKey: string,
  projectName: string | null,
  query: string | null
): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  if (projectKey.toLowerCase().includes(needle)) return true
  const name = projectName?.trim()
  if (name && name.toLowerCase().includes(needle)) return true
  return false
}
