export type TrainingStatusBucket = 'todo' | 'in_progress' | 'done' | 'other'

export type TrainingActivityRow = {
  id: string
  issueKey: string
  jiraUrl: string
  summary: string
  status: string
  statusBucket: TrainingStatusBucket
  personName: string | null
  fixVersions: string[]
  components: string[]
  labels: string[]
  estimateHours: number | null
  loggedHoursMonth: number
  fillPct: number | null
}

export type TrainingTaxonomyRow = {
  key: string
  label: string
  isMissing: boolean
  activityCount: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  loggedHoursMonth: number
}

export type TrainingKpis = {
  activityCount: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  loggedHoursMonth: number
  momDeltaHours: number
  momDeltaPct: number | null
  fillPct: number | null
  estimatedActivityCount: number
  missingEstimateCount: number
}

export type TrainingDashboardPayload = {
  monthKey: string
  kpis: TrainingKpis
  versions: TrainingTaxonomyRow[]
  components: TrainingTaxonomyRow[]
  labels: TrainingTaxonomyRow[]
  activities: TrainingActivityRow[]
}
