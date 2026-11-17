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
  id?: string
  label?: string
  muted?: boolean
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

export const CAPACITY_YEAR_GRID_ROW_KEYS = [
  'headcount',
  'netCapacityHours',
  'loggedHours',
  'commercialLoggedHours',
  'nonCommercialLoggedHours',
  'ptoHours',
  'capacityFillPct',
  'utilizationPct',
  'commercialUtilizationPct',
] as const

export type CapacityYearGridRowKey = (typeof CAPACITY_YEAR_GRID_ROW_KEYS)[number]

export type CapacityYearGridColumnKind = 'month' | 'quarter' | 'year'

export type CapacityYearGridColumn = {
  key: string
  label: string
  kind: CapacityYearGridColumnKind
  /** Month in progress: logged hours run through the last sync, net capacity is the full month. */
  inProgress: boolean
}

export type CapacityYearGridRow = {
  /** Row key; breakdown rows use `<parent key>:<role or project type key>`. */
  key: string
  label: string
  kind: CapacityYearKpiKind
  /** One value per column, in column order. Null when the period has no data. */
  values: (number | null)[]
  /** Rows that split this one, e.g. by role or by project type. */
  breakdown?: { label: string; rows: CapacityYearGridRow[] }
}

export type CapacityYearGrid = {
  year: number
  columns: CapacityYearGridColumn[]
  rows: CapacityYearGridRow[]
}

export type CapacityYearPayload = {
  currentYear: number
  throughMonthIndex: number
  throughLabel: string
  cards: CapacityYearKpiCard[]
  /** Month x KPI matrix per year, most recent first. */
  grids: CapacityYearGrid[]
}
