import type { ActivityProjectType } from '@/lib/domain/project-types'

export function monthKeyFromYearIndex(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function projectsActivityHref(params: {
  year: number
  monthIndex: number
  type?: string | null
  projectKey?: string | null
}): string {
  const query = new URLSearchParams({
    month: monthKeyFromYearIndex(params.year, params.monthIndex),
  })
  if (params.type && params.type !== 'all') {
    query.set('type', params.type)
  }
  if (params.projectKey) {
    query.set('project', params.projectKey)
  }
  return `/projects/activity?${query.toString()}`
}

export function openProjectsActivityTab(params: {
  year: number
  monthIndex: number
  type?: ActivityProjectType | string | null
}): void {
  window.open(projectsActivityHref(params), '_blank', 'noopener,noreferrer')
}
