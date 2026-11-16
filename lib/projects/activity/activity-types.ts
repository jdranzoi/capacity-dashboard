import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

/** A `dim_project_type` key, or `all`. */
export type ActivityProjectTypeFilter = string

export type ProjectsActivityRow = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: string
  status: string
  startDate: string | null
  endDate: string | null
  loggedHours: number
}

export type ProjectsActivityGroup = {
  type: string
  label: string
  rows: ProjectsActivityRow[]
}

export type ProjectsActivityPayload = {
  monthKey: string
  monthLabel: string
  typeFilter: ActivityProjectTypeFilter
  totalCount: number
  totalLoggedHours: number
  groups: ProjectsActivityGroup[]
  typeOptions: { value: ActivityProjectTypeFilter; label: string }[]
}

export type ProjectsActivityPageData = {
  payload: ProjectsActivityPayload
  monthOptions: OverviewMonthOption[]
}
