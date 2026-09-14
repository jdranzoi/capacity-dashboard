import type { ActivityProjectType, ActivityProjectTypeFilter } from '@/lib/domain/project-types'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export type ProjectsActivityRow = {
  projectId: string
  projectKey: string
  projectName: string | null
  projectType: ActivityProjectType
  status: string
  startDate: string | null
  endDate: string | null
  loggedHours: number
  hasDeliveryDetail: boolean
}

export type ProjectsActivityGroup = {
  type: ActivityProjectType
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
  typeOptions: ActivityProjectTypeFilter[]
}

export type ProjectsActivityPageData = {
  payload: ProjectsActivityPayload
  monthOptions: OverviewMonthOption[]
}
