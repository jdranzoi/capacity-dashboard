import { format } from 'date-fns'

import type {
  CapacityYearFacts,
  CapacityYearOpsRow,
} from '@/lib/capacity/overview/load-capacity-year-facts'
import { buildCapacityYearGrid } from '@/lib/capacity/overview/build-capacity-year-grid'
import type { ContractorMonthHoursRow } from '@/lib/capacity/overview/load-contractor-month-hours'
import {
  bucketMonthOpsByYear,
  monthIndexOf,
  yearOf,
  type MonthOpsBucket,
} from '@/lib/capacity/overview/month-ops-buckets'
import {
  CAPACITY_YEAR_KPI_KEYS,
  type CapacityYearCompareRow,
  type CapacityYearKpiCard,
  type CapacityYearKpiKey,
  type CapacityYearPayload,
  type CapacityYearSeries,
  type CapacityYearStackLayer,
} from '@/lib/capacity/overview/capacity-year-types'
import {
  compareRoleKeysByDisplayOrder,
  roleKeyAcronym,
} from '@/lib/domain/role-keys'
import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import type { ProjectTypeOption } from '@/lib/domain/project-types'
import {
  COMMERCIAL_UTILIZATION_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import {
  commercialUtilizationPct,
  loggedUtilizationPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'

type LineKpiKey = Exclude<CapacityYearKpiKey, 'headcount' | 'projectCount'>

const KPI_META: Record<
  LineKpiKey,
  { label: string; kind: 'hours' | 'pct' }
> = {
  netCapacityHours: {
    label: 'Net capacity',
    kind: 'hours',
  },
  loggedHours: {
    label: 'Logged',
    kind: 'hours',
  },
  nonCommercialLoggedHours: {
    label: 'Non-commercial hours',
    kind: 'hours',
  },
  commercialLoggedHours: {
    label: 'Commercial hours',
    kind: 'hours',
  },
  utilizationPct: {
    label: UTILIZATION_KPI.label,
    kind: 'pct',
  },
  commercialUtilizationPct: {
    label: COMMERCIAL_UTILIZATION_KPI.label,
    kind: 'pct',
  },
  ptoHours: {
    label: 'PTO',
    kind: 'hours',
  },
}

function deltaPct(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

function monthMetric(bucket: MonthOpsBucket, key: LineKpiKey): number | null {
  if (!bucket.hasRows) return null
  switch (key) {
    case 'netCapacityHours':
      return bucket.hours.net_capacity_hours
    case 'loggedHours':
      return bucket.hours.logged_hours
    case 'nonCommercialLoggedHours':
      return bucket.hours.non_commercial_logged_hours
    case 'commercialLoggedHours':
      return bucket.hours.commercial_logged_hours
    case 'ptoHours':
      return bucket.hours.pto_hours
    case 'utilizationPct':
      return loggedUtilizationPct(
        bucket.hours.logged_hours,
        bucket.elapsedDays * STANDARD_WORKDAY_HOURS
      )
    case 'commercialUtilizationPct':
      return commercialUtilizationPct(
        bucket.hours.commercial_logged_hours,
        bucket.elapsedDays * STANDARD_WORKDAY_HOURS
      )
  }
}

function rangeMetric(
  buckets: MonthOpsBucket[],
  from: number,
  to: number,
  key: LineKpiKey
): number | null {
  const slice = buckets.slice(from, to + 1).filter((b) => b.hasRows)
  if (slice.length === 0) return null

  if (key === 'utilizationPct') {
    let logged = 0
    let elapsedHours = 0
    for (const bucket of slice) {
      logged += bucket.hours.logged_hours
      elapsedHours += bucket.elapsedDays * STANDARD_WORKDAY_HOURS
    }
    return loggedUtilizationPct(logged, elapsedHours)
  }

  if (key === 'commercialUtilizationPct') {
    let commercial = 0
    let elapsedHours = 0
    for (const bucket of slice) {
      commercial += bucket.hours.commercial_logged_hours
      elapsedHours += bucket.elapsedDays * STANDARD_WORKDAY_HOURS
    }
    return commercialUtilizationPct(commercial, elapsedHours)
  }

  let sum = 0
  for (const bucket of slice) {
    const value = monthMetric(bucket, key)
    if (value != null) sum += value
  }
  return sum
}

function throughLabel(throughMonthIndex: number): string {
  if (throughMonthIndex <= 0) return 'Jan'
  return `Jan–${format(new Date(2020, throughMonthIndex, 1), 'MMM')}`
}

export function buildCapacityYear(
  facts: CapacityYearFacts,
  projectTypes: readonly ProjectTypeOption[],
  planOps: CapacityYearOpsRow[],
  contractorHours: ContractorMonthHoursRow[],
  now: Date = new Date()
): CapacityYearPayload | null {
  if (facts.ops.length === 0) return null

  const currentYear = now.getFullYear()
  const throughMonthIndex = now.getMonth()
  const byYear = bucketMonthOpsByYear(facts.ops)

  const years = [...byYear.keys()].sort((a, b) => a - b)
  const keys: LineKpiKey[] = [
    'netCapacityHours',
    'loggedHours',
    'nonCommercialLoggedHours',
    'commercialLoggedHours',
    'utilizationPct',
    'commercialUtilizationPct',
    'ptoHours',
  ]

  const cards: CapacityYearKpiCard[] = keys.map((key) => {
    const compare: CapacityYearCompareRow[] = years.map((year) => {
      const months = byYear.get(year)!
      const period = rangeMetric(months, 0, throughMonthIndex, key)
      const full =
        year === currentYear ? null : rangeMetric(months, 0, 11, key)
      return { year, period, full, deltaPct: null }
    })
    const currentPeriod = compare.find((row) => row.year === currentYear)?.period ?? null
    for (const row of compare) {
      row.deltaPct =
        row.year === currentYear ? null : deltaPct(currentPeriod, row.period)
    }

    const series: CapacityYearSeries[] = years.map((year) => ({
      year,
      points: Array.from({ length: 12 }, (_, monthIndex) => {
        if (year === currentYear && monthIndex > throughMonthIndex) {
          return { monthIndex, value: null }
        }
        return { monthIndex, value: monthMetric(byYear.get(year)![monthIndex], key) }
      }),
    }))

    return {
      key,
      label: KPI_META[key].label,
      kind: KPI_META[key].kind,
      years: [...compare].sort((a, b) => b.year - a.year),
      series,
    }
  })

  cards.push(
    buildHeadcountCard(facts, years, currentYear, throughMonthIndex),
    buildProjectCountCard(facts, years, currentYear, throughMonthIndex)
  )
  cards.sort(
    (a, b) => CAPACITY_YEAR_KPI_KEYS.indexOf(a.key) - CAPACITY_YEAR_KPI_KEYS.indexOf(b.key)
  )

  return {
    currentYear,
    throughMonthIndex,
    throughLabel: throughLabel(throughMonthIndex),
    cards,
    // Synced years plus the next year once the latest snapshot plans into it.
    grids: [...new Set([...years, ...planOps.map((row) => yearOf(row.month_date))])]
      .filter((year) => year <= currentYear + 1)
      .sort((a, b) => b - a)
      .map((year) =>
        buildCapacityYearGrid({
          year,
          ops: facts.ops.filter((row) => yearOf(row.month_date) === year),
          planOps: planOps.filter((row) => yearOf(row.month_date) === year),
          projects: facts.projects.filter((row) => yearOf(row.month_date) === year),
          contractorHours: contractorHours.filter((row) => yearOf(row.month_date) === year),
          roles: facts.roles,
          projectTypes,
          currentYear,
          throughMonthIndex,
        })
      ),
  }
}

const UNASSIGNED_ROLE = { key: 'unassigned', label: 'Unassigned' } as const

const PROJECT_COMMERCIAL_COLOR = 'var(--overview-metric-billable)'
const PROJECT_OTHER_COLOR = 'color-mix(in oklch, var(--muted-foreground) 42%, transparent)'

function uniqueCountDeltaRows(
  years: number[],
  currentYear: number,
  throughMonthIndex: number,
  idsByYearMonth: Map<number, Set<string>[]>
): CapacityYearCompareRow[] {
  const compare: CapacityYearCompareRow[] = years.map((year) => {
    const months = idsByYearMonth.get(year) ?? Array.from({ length: 12 }, () => new Set<string>())
    const periodIds = new Set<string>()
    const fullIds = new Set<string>()
    months.forEach((ids, monthIndex) => {
      if (monthIndex <= throughMonthIndex) {
        for (const id of ids) periodIds.add(id)
      }
      for (const id of ids) fullIds.add(id)
    })
    return {
      year,
      period: periodIds.size > 0 ? periodIds.size : null,
      full: year === currentYear ? null : fullIds.size > 0 ? fullIds.size : null,
      deltaPct: null,
    }
  })
  const currentPeriod = compare.find((row) => row.year === currentYear)?.period ?? null
  for (const row of compare) {
    row.deltaPct = row.year === currentYear ? null : deltaPct(currentPeriod, row.period)
  }
  return [...compare].sort((a, b) => b.year - a.year)
}

function monthlyTotalsFromIds(
  years: number[],
  currentYear: number,
  throughMonthIndex: number,
  idsByYearMonth: Map<number, Set<string>[]>
): CapacityYearSeries[] {
  return years.map((year) => ({
    year,
    points: Array.from({ length: 12 }, (_, monthIndex) => {
      if (year === currentYear && monthIndex > throughMonthIndex) {
        return { monthIndex, value: null }
      }
      const ids = idsByYearMonth.get(year)?.[monthIndex]
      if (!ids || ids.size === 0) return { monthIndex, value: null }
      return { monthIndex, value: ids.size }
    }),
  }))
}

function buildHeadcountCard(
  facts: CapacityYearFacts,
  years: number[],
  currentYear: number,
  throughMonthIndex: number
): CapacityYearKpiCard {
  const roleById = new Map(facts.roles.map((role) => [role.id, role]))
  const peopleByYearMonth = new Map<number, Set<string>[]>()
  const roleMonth = new Map<string, number[]>()

  // Headcount = the month's capacity population (D-034): everyone employed that month,
  // including people with zero net capacity (e.g. a full month of PTO).
  for (const row of facts.ops) {
    const year = yearOf(row.month_date)
    const monthIndex = monthIndexOf(row.month_date)
    if (monthIndex < 0 || monthIndex > 11) continue

    let months = peopleByYearMonth.get(year)
    if (!months) {
      months = Array.from({ length: 12 }, () => new Set<string>())
      peopleByYearMonth.set(year, months)
    }
    months[monthIndex].add(row.person_id)

    if (year !== currentYear || monthIndex > throughMonthIndex) continue
    const role = row.role_id ? roleById.get(row.role_id) : undefined
    const roleKey = role?.key ?? UNASSIGNED_ROLE.key
    let counts = roleMonth.get(roleKey)
    if (!counts) {
      counts = Array.from({ length: 12 }, () => 0)
      roleMonth.set(roleKey, counts)
    }
    counts[monthIndex] += 1
  }

  const stacks: CapacityYearStackLayer[] = [...roleMonth.keys()]
    .sort(compareRoleKeysByDisplayOrder)
    .map((roleKey) => {
      const counts = roleMonth.get(roleKey)!
      return {
        key: roleKey,
        label: roleKey === UNASSIGNED_ROLE.key ? UNASSIGNED_ROLE.label : roleKeyAcronym(roleKey),
        colorVar: roleColorVar(roleKey),
        points: counts.map((value, monthIndex) => ({
          monthIndex,
          value: monthIndex > throughMonthIndex ? null : value > 0 ? value : 0,
        })),
      }
    })

  return {
    key: 'headcount',
    label: 'Headcount',
    kind: 'count',
    years: uniqueCountDeltaRows(years, currentYear, throughMonthIndex, peopleByYearMonth),
    series: monthlyTotalsFromIds(years, currentYear, throughMonthIndex, peopleByYearMonth),
    stacks,
  }
}

function emptyMonthCounts(): number[] {
  return Array.from({ length: 12 }, () => 0)
}

function countsToStackPoints(
  counts: number[],
  throughMonthIndex: number
): CapacityYearStackLayer['points'] {
  return counts.map((value, monthIndex) => ({
    monthIndex,
    value: monthIndex > throughMonthIndex ? null : value > 0 ? value : 0,
  }))
}

function buildProjectCountCard(
  facts: CapacityYearFacts,
  years: number[],
  currentYear: number,
  throughMonthIndex: number
): CapacityYearKpiCard {
  const commercialByYearMonth = new Map<number, Set<string>[]>()
  const otherByYearMonth = new Map<number, Set<string>[]>()
  const commercialMonth = emptyMonthCounts()
  const otherMonth = emptyMonthCounts()

  for (const row of facts.projects) {
    const year = yearOf(row.month_date)
    const monthIndex = monthIndexOf(row.month_date)
    if (monthIndex < 0 || monthIndex > 11) continue

    const target = row.is_commercial ? commercialByYearMonth : otherByYearMonth
    let months = target.get(year)
    if (!months) {
      months = Array.from({ length: 12 }, () => new Set<string>())
      target.set(year, months)
    }
    months[monthIndex].add(row.project_id)

    if (year !== currentYear || monthIndex > throughMonthIndex) continue
    if (row.is_commercial) commercialMonth[monthIndex] += 1
    else otherMonth[monthIndex] += 1
  }

  const ncSeries = monthlyTotalsFromIds(
    years,
    currentYear,
    throughMonthIndex,
    otherByYearMonth
  )
    .map((series) => ({
      ...series,
      id: `nc-${series.year}`,
      label: `NC ${series.year}`,
      muted: true,
    }))
    .filter((series) => series.points.some((point) => point.value != null))

  return {
    key: 'projectCount',
    label: 'Projects',
    kind: 'count',
    years: uniqueCountDeltaRows(years, currentYear, throughMonthIndex, commercialByYearMonth),
    series: [
      ...monthlyTotalsFromIds(years, currentYear, throughMonthIndex, commercialByYearMonth),
      ...ncSeries,
    ],
    stacks: [
      {
        key: 'commercial',
        label: 'Commercial',
        colorVar: PROJECT_COMMERCIAL_COLOR,
        points: countsToStackPoints(commercialMonth, throughMonthIndex),
      },
      {
        key: 'noncommercial',
        label: 'Other',
        colorVar: PROJECT_OTHER_COLOR,
        points: countsToStackPoints(otherMonth, throughMonthIndex),
      },
    ],
  }
}
