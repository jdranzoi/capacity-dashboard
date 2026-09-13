export const CAPACITY_YEAR_KPI_KEYS = [
  'netCapacityHours',
  'headcount',
  'projectCount',
  'loggedHours',
  'commercialLoggedHours',
  'nonCommercialLoggedHours',
  'utilizationPct',
  'commercialUtilizationPct',
  'ptoHours',
] as const

export type CapacityYearKpiKey = (typeof CAPACITY_YEAR_KPI_KEYS)[number]

export type CapacityYearKpiKind = 'hours' | 'pct' | 'count'

export type CapacityYearCompareRow = {
  year: number
  period: number | null
  full: number | null
  deltaPct: number | null
}

export type CapacityYearMonthPoint = {
  monthIndex: number
  value: number | null
}

export type CapacityYearSeries = {
  year: number
  points: CapacityYearMonthPoint[]
}

export type CapacityYearStackLayer = {
  key: string
  label: string
  colorVar: string
  points: CapacityYearMonthPoint[]
}

export type CapacityYearKpiCard = {
  key: CapacityYearKpiKey
  label: string
  kind: CapacityYearKpiKind
  years: CapacityYearCompareRow[]
  series: CapacityYearSeries[]
  stacks?: CapacityYearStackLayer[]
}

export type CapacityYearPayload = {
  currentYear: number
  throughMonthIndex: number
  throughLabel: string
  cards: CapacityYearKpiCard[]
}
