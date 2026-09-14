import {
  isActivityProjectType,
  type ActivityProjectTypeFilter,
} from '@/lib/domain/project-types'

export type ProjectsActivityRouteFilters = {
  monthKey: string | null
  type: ActivityProjectTypeFilter
  projectKey: string | null
}

export type ProjectsActivityListParams = {
  month?: string
  type?: string
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined
  return Array.isArray(value) ? value[0] : value
}

export function parseProjectsActivityRouteFilters(
  raw: Record<string, string | string[] | undefined>
): ProjectsActivityRouteFilters {
  const monthRaw = firstParam(raw.month)?.trim()
  const typeRaw = firstParam(raw.type)?.toLowerCase()
  const projectRaw = firstParam(raw.project)?.trim()

  let type: ActivityProjectTypeFilter = 'all'
  if (typeRaw && typeRaw !== 'all' && isActivityProjectType(typeRaw)) {
    type = typeRaw
  }

  return {
    monthKey: monthRaw && monthRaw.length > 0 ? monthRaw : null,
    type,
    projectKey: projectRaw && projectRaw.length > 0 ? projectRaw : null,
  }
}

export function pickActivityListSearchParams(
  raw: Record<string, string | string[] | undefined>
): ProjectsActivityListParams {
  return {
    month: firstParam(raw.month),
    type: firstParam(raw.type),
  }
}

export function activityListSlotKey(params: ProjectsActivityListParams): string {
  return [params.month ?? '', params.type ?? ''].join('|')
}
