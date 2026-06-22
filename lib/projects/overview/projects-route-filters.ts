import {
  DEFAULT_PROJECT_SPACE_TYPE,
  isProjectSpaceType,
  type ProjectSpaceType,
} from '@/lib/domain/project-types'

export type ProjectsViewMode = 'monthly' | 'global'

export type ProjectsCategoryFilter = ProjectSpaceType

export type ProjectsRouteFilters = {
  view: ProjectsViewMode
  category: ProjectsCategoryFilter
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
  if (category === 'build') return 'global'
  return 'monthly'
}

export function parseProjectsRouteFilters(
  raw: Record<string, string | string[] | undefined>
): ProjectsRouteFilters {
  const viewRaw = firstParam(raw.view)?.toLowerCase()
  const requestedView: ProjectsViewMode =
    viewRaw === 'monthly' ? 'monthly' : 'global'

  const categoryRaw = firstParam(raw.category)?.toLowerCase()
  let category: ProjectsCategoryFilter = DEFAULT_PROJECT_SPACE_TYPE
  if (categoryRaw && isProjectSpaceType(categoryRaw)) {
    category = categoryRaw
  }

  const view = coerceViewForCategory(category, requestedView)

  const q = firstParam(raw.q)?.trim()
  const project = firstParam(raw.project)?.trim()
  const pm = firstParam(raw.pm)?.trim()

  return {
    view,
    category,
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
