import type { CapacityYearOpsRow } from '@/lib/capacity/overview/load-capacity-year-facts'

export type MonthOpsHourKey =
  | 'net_capacity_hours'
  | 'planned_hours'
  | 'logged_hours'
  | 'non_commercial_logged_hours'
  | 'commercial_logged_hours'
  | 'pto_hours'

export const MONTH_OPS_HOUR_KEYS: MonthOpsHourKey[] = [
  'net_capacity_hours',
  'planned_hours',
  'logged_hours',
  'non_commercial_logged_hours',
  'commercial_logged_hours',
  'pto_hours',
]

/** Org roll-up of `fact_month_ops` for one calendar month. */
export type MonthOpsBucket = {
  hasRows: boolean
  /** One `fact_month_ops` row per person-month: the month's capacity population (D-034). */
  headcount: number
  hours: Record<MonthOpsHourKey, number>
  elapsedDays: number
}

function emptyBucket(): MonthOpsBucket {
  return {
    hasRows: false,
    headcount: 0,
    hours: {
      net_capacity_hours: 0,
      planned_hours: 0,
      logged_hours: 0,
      non_commercial_logged_hours: 0,
      commercial_logged_hours: 0,
      pto_hours: 0,
    },
    elapsedDays: 0,
  }
}

export function yearOf(monthDate: string): number {
  return Number(monthDate.slice(0, 4))
}

export function monthIndexOf(monthDate: string): number {
  return Number(monthDate.slice(5, 7)) - 1
}

function num(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function emptyMonthOpsYear(): MonthOpsBucket[] {
  return Array.from({ length: 12 }, emptyBucket)
}

/** Twelve month buckets per calendar year. */
export function bucketMonthOpsByYear(ops: CapacityYearOpsRow[]): Map<number, MonthOpsBucket[]> {
  const byYear = new Map<number, MonthOpsBucket[]>()
  for (const row of ops) {
    const year = yearOf(row.month_date)
    const monthIndex = monthIndexOf(row.month_date)
    if (monthIndex < 0 || monthIndex > 11) continue
    let months = byYear.get(year)
    if (!months) {
      months = emptyMonthOpsYear()
      byYear.set(year, months)
    }
    const bucket = months[monthIndex]
    bucket.hasRows = true
    bucket.headcount += 1
    for (const key of MONTH_OPS_HOUR_KEYS) {
      bucket.hours[key] += num(row[key])
    }
    bucket.elapsedDays += num(row.elapsed_net_weekdays)
  }
  return byYear
}
