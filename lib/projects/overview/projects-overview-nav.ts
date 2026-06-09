import { format, startOfMonth } from 'date-fns'

import { DEFAULT_PROJECT_SPACE_TYPE } from '@/lib/domain/project-types'
import {
  coerceViewForCategory,
  type ProjectsCategoryFilter,
  type ProjectsViewMode,
} from '@/lib/projects/overview/projects-route-filters'

export type ProjectsOverviewNavUpdates = Record<string, string | null>

function applyCategoryViewRules(
  next: URLSearchParams,
  category: ProjectsCategoryFilter
): void {
  const viewRaw = next.get('view')
  const requestedView: ProjectsViewMode =
    viewRaw === 'monthly' ? 'monthly' : 'global'
  const coerced = coerceViewForCategory(category, requestedView)
  if (coerced === 'global') {
    next.delete('view')
  } else {
    next.set('view', 'monthly')
    const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM')
    next.set('month', currentMonthKey)
  }
}

/**
 * Builds the next query string for Projects overview navigation.
 * Clears `project` on filter changes unless `project` is explicitly set in updates.
 */
export function buildProjectsOverviewNavUpdates(
  current: URLSearchParams,
  updates: ProjectsOverviewNavUpdates
): URLSearchParams {
  const next = new URLSearchParams(current.toString())
  const isProjectSelection = Object.prototype.hasOwnProperty.call(updates, 'project')

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'category')) {
    const category = (updates.category ?? DEFAULT_PROJECT_SPACE_TYPE) as ProjectsCategoryFilter
    applyCategoryViewRules(next, category)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'view') && !isProjectSelection) {
    const view = updates.view as ProjectsViewMode
    if (view === 'global') {
      next.delete('view')
    } else {
      next.set('view', 'monthly')
    }
  }

  if (!isProjectSelection) {
    next.delete('project')
  }

  return next
}

export function projectsOverviewHref(
  pathname: string,
  current: URLSearchParams,
  updates: ProjectsOverviewNavUpdates
): string {
  const next = buildProjectsOverviewNavUpdates(current, updates)
  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
