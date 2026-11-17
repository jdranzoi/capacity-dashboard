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
  COMMERCIAL_UTILIZATION_KPI,
  PLANNED_UTILIZATION_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import {
  compareProjectTypes,
  UNCLASSIFIED_PROJECT_TYPE,
  type ProjectTypeOption,
} from '@/lib/domain/project-types'
import { compareRoleKeysByDisplayOrder } from '@/lib/domain/role-keys'
import {
  commercialUtilizationPct,
  loggedUtilizationPct,
  plannedPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'

const ROW_META: Record<CapacityYearGridRowKey, { label: string; kind: CapacityYearKpiKind }> = {
  headcount: { label: 'Headcount', kind: 'count' },
  netCapacityHours: { label: 'Net capacity', kind: 'hours' },
  plannedHours: { label: 'Planned hours', kind: 'hours' },
  loggedHours: { label: 'Logged hours', kind: 'hours' },
  commercialLoggedHours: { label: 'Commercial hours', kind: 'hours' },
  nonCommercialLoggedHours: { label: 'Non-commercial hours', kind: 'hours' },
  ptoHours: { label: 'PTO', kind: 'hours' },
  plannedUtilizationPct: { label: PLANNED_UTILIZATION_KPI.label, kind: 'pct' },
  utilizationPct: { label: UTILIZATION_KPI.label, kind: 'pct' },
  commercialUtilizationPct: { label: COMMERCIAL_UTILIZATION_KPI.label, kind: 'pct' },
}

const ROLE_BREAKDOWN_ROWS = new Set<CapacityYearGridRowKey>([
  'headcount',
  'netCapacityHours',
  'plannedHours',
  'loggedHours',
  'plannedUtilizationPct',
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

/** Periods in column order: 12 months, 4 quarters, the year. Each is a list of month indexes. */
const PERIODS: number[][] = [
  ...Array.from({ length: 12 }, (_, m) => [m]),
  ...QUARTERS.map((q) => [q * 3, q * 3 + 1, q * 3 + 2]),
  Array.from({ length: 12 }, (_, m) => m),
]

/**
 * Period totals. Capacity-side figures (headcount, net capacity, planned, PTO) cover every
 * month with data, plan months included. Logged-side figures cover synced months only:
 * plan months have nothing logged yet.
 */
type PeriodTotals = {
  months: number
  headcountSum: number
  netCapacity: number
  planned: number
  pto: number
  actualMonths: number
  logged: number
  commercial: number
  nonCommercial: number
  elapsedCapacity: number
}

function totalsOf(months: { bucket: MonthOpsBucket; plan: boolean }[]): PeriodTotals | null {
  const withRows = months.filter((month) => month.bucket.hasRows)
  if (withRows.length === 0) return null
  const totals: PeriodTotals = {
    months: withRows.length,
    headcountSum: 0,
    netCapacity: 0,
    planned: 0,
    pto: 0,
    actualMonths: 0,
    logged: 0,
    commercial: 0,
    nonCommercial: 0,
    elapsedCapacity: 0,
  }
  for (const { bucket, plan } of withRows) {
    totals.headcountSum += bucket.headcount
    totals.netCapacity += bucket.hours.net_capacity_hours
    totals.planned += bucket.hours.planned_hours
    totals.pto += bucket.hours.pto_hours
    if (plan) continue
    totals.actualMonths += 1
    totals.logged += bucket.hours.logged_hours
    totals.commercial += bucket.hours.commercial_logged_hours
    totals.nonCommercial += bucket.hours.non_commercial_logged_hours
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
      return totals.headcountSum / totals.months
    case 'netCapacityHours':
      return totals.netCapacity
    case 'plannedHours':
      return totals.planned
    case 'ptoHours':
      return totals.pto
    case 'plannedUtilizationPct':
      return plannedPct(totals.planned, totals.netCapacity)
  }
  if (totals.actualMonths === 0) return null
  switch (key) {
    case 'loggedHours':
      return totals.logged
    case 'commercialLoggedHours':
      return totals.commercial
    case 'nonCommercialLoggedHours':
      return totals.nonCommercial
    case 'utilizationPct':
      return loggedUtilizationPct(totals.logged, totals.elapsedCapacity)
    case 'commercialUtilizationPct':
      return commercialUtilizationPct(totals.commercial, totals.elapsedCapacity)
  }
}

/** Sum of project hours over the period's synced months; null when the period has none. */
function hoursValues(monthHours: number[], actualMonths: boolean[]): (number | null)[] {
  return PERIODS.map((period) => {
    const months = period.filter((m) => actualMonths[m])
    if (months.length === 0) return null
    return months.reduce((sum, m) => sum + monthHours[m], 0)
  })
}

function hasAnyValue(values: (number | null)[]): boolean {
  return values.some((value) => value != null && value !== 0)
}

/**
 * Month x KPI matrix for one year: 12 months, 4 quarters and the year.
 *
 * Synced months come from `fact_month_ops`. Months after `throughMonthIndex` of the current
 * year, and every month of a later year, come from `planOps` (the latest snapshot's capacity
 * and delivery plans, up to the sync horizon) and only carry capacity-side figures.
 *
 * Some rows carry a breakdown: by month role (`role_id`) or by project type
 * (`fact_month_projects` population hours, which sum to the commercial / non-commercial rows).
 */
export function buildCapacityYearGrid(params: {
  year: number
  ops: CapacityYearOpsRow[]
  planOps: CapacityYearOpsRow[]
  projects: CapacityYearProjectRow[]
  roles: CapacityYearRoleRow[]
  projectTypes: readonly ProjectTypeOption[]
  currentYear: number
  throughMonthIndex: number
}): CapacityYearGrid {
  const { year, roles, projectTypes, currentYear, throughMonthIndex } = params
  const isCurrentYear = year === currentYear
  const isPlanMonth = (monthIndex: number) =>
    year > currentYear || (isCurrentYear && monthIndex > throughMonthIndex)

  const ops = [
    ...params.ops.filter((row) => !isPlanMonth(monthIndexOf(row.month_date))),
    ...params.planOps.filter((row) => isPlanMonth(monthIndexOf(row.month_date))),
  ]

  const withPlanFlag = (buckets: MonthOpsBucket[]) =>
    buckets.map((bucket, monthIndex) => ({ bucket, plan: isPlanMonth(monthIndex) }))
  const valuesOf = (buckets: MonthOpsBucket[], key: CapacityYearGridRowKey) => {
    const months = withPlanFlag(buckets)
    return PERIODS.map((period) => periodValue(totalsOf(period.map((m) => months[m])), key))
  }

  const months = bucketMonthOpsByYear(ops).get(year) ?? emptyMonthOpsYear()
  const actualMonths = months.map((bucket, m) => bucket.hasRows && !isPlanMonth(m))
  const planMonths = months.map((bucket, m) => bucket.hasRows && isPlanMonth(m))

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
  const typeHours = new Map<
    string,
    Record<'population_commercial_hours' | 'population_non_commercial_hours', number[]>
  >()
  for (const row of params.projects) {
    const monthIndex = monthIndexOf(row.month_date)
    if (monthIndex < 0 || monthIndex > 11) continue
    const typeKey =
      row.project_type && typeByValue.has(row.project_type)
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
    .map(
      (key) => typeByValue.get(key) ?? { value: key, label: 'Unclassified', isCommercial: false }
    )
    .sort(compareProjectTypes)

  const columns: CapacityYearGridColumn[] = [
    ...Array.from({ length: 12 }, (_, monthIndex) => ({
      key: `m${monthIndex + 1}`,
      label: format(new Date(year, monthIndex, 1), 'MMM'),
      kind: 'month' as const,
      inProgress: isCurrentYear && monthIndex === throughMonthIndex,
      plan: planMonths[monthIndex],
      monthKey: format(new Date(year, monthIndex, 1), 'yyyy-MM'),
    })),
    ...QUARTERS.map((quarter) => ({
      key: `q${quarter + 1}`,
      label: `Q${quarter + 1}`,
      kind: 'quarter' as const,
      inProgress: isCurrentYear && Math.floor(throughMonthIndex / 3) === quarter,
      plan: PERIODS[12 + quarter].some((m) => planMonths[m]),
      monthKey: null,
    })),
    {
      key: 'year',
      label: String(year),
      kind: 'year' as const,
      inProgress: isCurrentYear,
      plan: planMonths.some(Boolean),
      monthKey: null,
    },
  ]

  const rows = CAPACITY_YEAR_GRID_ROW_KEYS.map((key): CapacityYearGridRow => {
    const { label, kind } = ROW_META[key]
    const row: CapacityYearGridRow = { key, label, kind, values: valuesOf(months, key) }

    if (ROLE_BREAKDOWN_ROWS.has(key)) {
      const children = roleMonths
        .map((role) => ({
          key: `${key}:${role.key}`,
          label: role.label,
          kind,
          values: valuesOf(role.months, key),
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
          values: hoursValues(typeHours.get(type.value)![typeField], actualMonths),
        }))
        .filter((child) => hasAnyValue(child.values))
      if (children.length > 0) row.breakdown = { label: 'By project type', rows: children }
    }

    return row
  })

  return { year, columns, rows }
}
