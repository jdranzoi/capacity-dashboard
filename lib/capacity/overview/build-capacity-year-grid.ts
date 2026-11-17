import { format } from 'date-fns'

import type {
  CapacityYearOpsRow,
  CapacityYearProjectRow,
  CapacityYearRoleRow,
} from '@/lib/capacity/overview/load-capacity-year-facts'
import {
  bucketMonthOpsByYear,
  emptyMonthOpsYear,
  monthIndexOf,
  type MonthOpsBucket,
} from '@/lib/capacity/overview/month-ops-buckets'
import {
  CAPACITY_YEAR_GRID_ROW_KEYS,
  type CapacityYearGrid,
  type CapacityYearGridColumn,
  type CapacityYearGridRow,
  type CapacityYearGridRowKey,
  type CapacityYearKpiKind,
} from '@/lib/capacity/overview/capacity-year-types'
import {
  CAPACITY_FILL_KPI,
  COMMERCIAL_UTILIZATION_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import {
  compareProjectTypes,
  UNCLASSIFIED_PROJECT_TYPE,
  type ProjectTypeOption,
} from '@/lib/domain/project-types'
import { compareRoleKeysByDisplayOrder } from '@/lib/domain/role-keys'
import {
  capacityFillPct,
  commercialUtilizationPct,
  loggedUtilizationPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'

const ROW_META: Record<CapacityYearGridRowKey, { label: string; kind: CapacityYearKpiKind }> = {
  headcount: { label: 'Headcount', kind: 'count' },
  netCapacityHours: { label: 'Net capacity', kind: 'hours' },
  loggedHours: { label: 'Logged hours', kind: 'hours' },
  commercialLoggedHours: { label: 'Commercial hours', kind: 'hours' },
  nonCommercialLoggedHours: { label: 'Non-commercial hours', kind: 'hours' },
  ptoHours: { label: 'PTO', kind: 'hours' },
  capacityFillPct: { label: CAPACITY_FILL_KPI.label, kind: 'pct' },
  utilizationPct: { label: UTILIZATION_KPI.label, kind: 'pct' },
  commercialUtilizationPct: { label: COMMERCIAL_UTILIZATION_KPI.label, kind: 'pct' },
}

const ROLE_BREAKDOWN_ROWS = new Set<CapacityYearGridRowKey>([
  'headcount',
  'netCapacityHours',
  'loggedHours',
  'utilizationPct',
  'commercialUtilizationPct',
])

const TYPE_BREAKDOWN_FIELD: Partial<
  Record<CapacityYearGridRowKey, 'population_commercial_hours' | 'population_non_commercial_hours'>
> = {
  commercialLoggedHours: 'population_commercial_hours',
  nonCommercialLoggedHours: 'population_non_commercial_hours',
}

const UNASSIGNED_ROLE = { key: 'unassigned', label: 'Unassigned' } as const

const QUARTERS = [0, 1, 2, 3] as const

type PeriodTotals = {
  monthsWithRows: number
  headcountSum: number
  netCapacity: number
  logged: number
  commercial: number
  nonCommercial: number
  pto: number
  elapsedCapacity: number
}

function totalsOf(buckets: MonthOpsBucket[]): PeriodTotals | null {
  const withRows = buckets.filter((bucket) => bucket.hasRows)
  if (withRows.length === 0) return null
  const totals: PeriodTotals = {
    monthsWithRows: withRows.length,
    headcountSum: 0,
    netCapacity: 0,
    logged: 0,
    commercial: 0,
    nonCommercial: 0,
    pto: 0,
    elapsedCapacity: 0,
  }
  for (const bucket of withRows) {
    totals.headcountSum += bucket.headcount
    totals.netCapacity += bucket.hours.net_capacity_hours
    totals.logged += bucket.hours.logged_hours
    totals.commercial += bucket.hours.commercial_logged_hours
    totals.nonCommercial += bucket.hours.non_commercial_logged_hours
    totals.pto += bucket.hours.pto_hours
    totals.elapsedCapacity += bucket.elapsedDays * STANDARD_WORKDAY_HOURS
  }
  return totals
}

/**
 * Hours add up across months. Headcount over several months is the monthly average.
 * Ratios are ratios of the summed hours (D-032), never an average of monthly percentages.
 */
function periodValue(totals: PeriodTotals | null, key: CapacityYearGridRowKey): number | null {
  if (!totals) return null
  switch (key) {
    case 'headcount':
      return totals.headcountSum / totals.monthsWithRows
    case 'netCapacityHours':
      return totals.netCapacity
    case 'loggedHours':
      return totals.logged
    case 'commercialLoggedHours':
      return totals.commercial
    case 'nonCommercialLoggedHours':
      return totals.nonCommercial
    case 'ptoHours':
      return totals.pto
    case 'capacityFillPct':
      return capacityFillPct(totals.logged, totals.netCapacity)
    case 'utilizationPct':
      return loggedUtilizationPct(totals.logged, totals.elapsedCapacity)
    case 'commercialUtilizationPct':
      return commercialUtilizationPct(totals.commercial, totals.elapsedCapacity)
  }
}

/** Periods in column order: 12 months, 4 quarters, the year. Each is a list of month indexes. */
const PERIODS: number[][] = [
  ...Array.from({ length: 12 }, (_, m) => [m]),
  ...QUARTERS.map((q) => [q * 3, q * 3 + 1, q * 3 + 2]),
  Array.from({ length: 12 }, (_, m) => m),
]

function opsValues(
  months: MonthOpsBucket[],
  key: CapacityYearGridRowKey
): (number | null)[] {
  return PERIODS.map((period) => periodValue(totalsOf(period.map((m) => months[m])), key))
}

/** Sum of project hours over the period's months that have capacity data; null when none. */
function hoursValues(monthHours: number[], visibleMonths: boolean[]): (number | null)[] {
  return PERIODS.map((period) => {
    const months = period.filter((m) => visibleMonths[m])
    if (months.length === 0) return null
    return months.reduce((sum, m) => sum + monthHours[m], 0)
  })
}

function hasAnyValue(values: (number | null)[]): boolean {
  return values.some((value) => value != null && value !== 0)
}

/**
 * Month x KPI matrix for one year from `fact_month_ops`: 12 months, 4 quarters and the year.
 * In the current year, months after `throughMonthIndex` are left empty so quarter and year
 * totals cover only elapsed months.
 *
 * Some rows carry a breakdown: by month role (`fact_month_ops.role_id`) or by project type
 * (`fact_month_projects` population hours, which sum to the commercial / non-commercial rows).
 */
export function buildCapacityYearGrid(params: {
  year: number
  ops: CapacityYearOpsRow[]
  projects: CapacityYearProjectRow[]
  roles: CapacityYearRoleRow[]
  projectTypes: readonly ProjectTypeOption[]
  currentYear: number
  throughMonthIndex: number
}): CapacityYearGrid {
  const { year, roles, projectTypes, currentYear, throughMonthIndex } = params
  const isCurrentYear = year === currentYear
  const isVisibleMonth = (monthIndex: number) => !isCurrentYear || monthIndex <= throughMonthIndex

  const ops = params.ops.filter((row) => isVisibleMonth(monthIndexOf(row.month_date)))
  const months = bucketMonthOpsByYear(ops).get(year) ?? emptyMonthOpsYear()
  const visibleMonths = months.map((bucket) => bucket.hasRows)

  const roleById = new Map(roles.map((role) => [role.id, role]))
  const opsByRole = new Map<string, { label: string; rows: CapacityYearOpsRow[] }>()
  for (const row of ops) {
    const role = row.role_id ? roleById.get(row.role_id) : undefined
    const key = role?.key ?? UNASSIGNED_ROLE.key
    const entry = opsByRole.get(key) ?? { label: role?.label ?? UNASSIGNED_ROLE.label, rows: [] }
    entry.rows.push(row)
    opsByRole.set(key, entry)
  }
  const roleMonths = [...opsByRole.keys()].sort(compareRoleKeysByDisplayOrder).map((key) => {
    const entry = opsByRole.get(key)!
    return { key, label: entry.label, months: bucketMonthOpsByYear(entry.rows).get(year)! }
  })

  const typeByValue = new Map(projectTypes.map((type) => [type.value, type]))
  const typeHours = new Map<string, Record<'population_commercial_hours' | 'population_non_commercial_hours', number[]>>()
  for (const row of params.projects) {
    const monthIndex = monthIndexOf(row.month_date)
    if (monthIndex < 0 || monthIndex > 11) continue
    const typeKey = row.project_type && typeByValue.has(row.project_type)
      ? row.project_type
      : UNCLASSIFIED_PROJECT_TYPE
    const entry = typeHours.get(typeKey) ?? {
      population_commercial_hours: Array.from({ length: 12 }, () => 0),
      population_non_commercial_hours: Array.from({ length: 12 }, () => 0),
    }
    entry.population_commercial_hours[monthIndex] += row.population_commercial_hours
    entry.population_non_commercial_hours[monthIndex] += row.population_non_commercial_hours
    typeHours.set(typeKey, entry)
  }
  const orderedTypes = [...typeHours.keys()]
    .map((key) => typeByValue.get(key) ?? { value: key, label: 'Unclassified', isCommercial: false })
    .sort(compareProjectTypes)

  const columns: CapacityYearGridColumn[] = [
    ...Array.from({ length: 12 }, (_, monthIndex) => ({
      key: `m${monthIndex + 1}`,
      label: format(new Date(year, monthIndex, 1), 'MMM'),
      kind: 'month' as const,
      inProgress: isCurrentYear && monthIndex === throughMonthIndex,
    })),
    ...QUARTERS.map((quarter) => ({
      key: `q${quarter + 1}`,
      label: `Q${quarter + 1}`,
      kind: 'quarter' as const,
      inProgress: isCurrentYear && Math.floor(throughMonthIndex / 3) === quarter,
    })),
    { key: 'year', label: String(year), kind: 'year' as const, inProgress: isCurrentYear },
  ]

  const rows = CAPACITY_YEAR_GRID_ROW_KEYS.map((key): CapacityYearGridRow => {
    const { label, kind } = ROW_META[key]
    const row: CapacityYearGridRow = { key, label, kind, values: opsValues(months, key) }

    if (ROLE_BREAKDOWN_ROWS.has(key)) {
      const children = roleMonths
        .map((role) => ({
          key: `${key}:${role.key}`,
          label: role.label,
          kind,
          values: opsValues(role.months, key),
        }))
        .filter((child) => hasAnyValue(child.values))
      if (children.length > 0) row.breakdown = { label: 'By role', rows: children }
    }

    const typeField = TYPE_BREAKDOWN_FIELD[key]
    if (typeField) {
      const children = orderedTypes
        .map((type) => ({
          key: `${key}:${type.value}`,
          label: type.label,
          kind,
          values: hoursValues(typeHours.get(type.value)![typeField], visibleMonths),
        }))
        .filter((child) => hasAnyValue(child.values))
      if (children.length > 0) row.breakdown = { label: 'By project type', rows: children }
    }

    return row
  })

  return { year, columns, rows }
}
