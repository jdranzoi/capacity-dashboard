export type TrainingYearChartUnit = 'hours' | 'count'

export type TrainingYearGroupedBar = {
  key: string
  label: string
  title?: string
  values: number[]
}

export type TrainingYearGroupedChartSpec = {
  id: string
  title: string
  description: string
  paramKey: 'month' | 'role'
  unit: TrainingYearChartUnit
  years: number[]
  currentYear: number
  bars: TrainingYearGroupedBar[]
}

export type TrainingYearCompareYear = {
  year: number
  hours: number
  trainings: number
  hoursFull: number | null
  trainingsFull: number | null
  hoursDeltaPct: number | null
  trainingsDeltaPct: number | null
}

export type TrainingYearKpis = {
  currentYear: number
  throughLabel: string
  years: TrainingYearCompareYear[]
}

export type TrainingYearRoleCompareRow = {
  key: string
  label: string
  title: string
  hoursByYear: number[]
}

export type TrainingYearRoleTable = {
  years: number[]
  currentYear: number
  throughLabel: string
  rows: TrainingYearRoleCompareRow[]
}

export type TrainingYearTaxonomyRow = {
  key: string
  label: string
  currentHours: number
  priorHours: number
  /** Percent of that year's training hours in the compare window. */
  currentSharePct: number
  priorSharePct: number
}

export type TrainingYearTaxonomyChartSpec = {
  id: string
  title: string
  description: string
  paramKey: 'version' | 'component'
  currentYear: number
  priorYear: number | null
  rows: TrainingYearTaxonomyRow[]
}

export type TrainingYearPayload = {
  year: number
  years: number[]
  kpis: TrainingYearKpis
  monthHours: TrainingYearGroupedChartSpec
  monthCounts: TrainingYearGroupedChartSpec
  roleCounts: TrainingYearGroupedChartSpec
  roleHours: TrainingYearGroupedChartSpec
  roleTable: TrainingYearRoleTable
  versions: TrainingYearTaxonomyChartSpec
  areas: TrainingYearTaxonomyChartSpec
}
