import {
  eachDayOfInterval,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import { roundDisplayStat } from '@/lib/format/display-stats'
import type { ProjectExecutionPoint } from '@/lib/projects/overview/projects-types'

/** Converts per-period increments into running cumulative totals. */
export function toCumulativeExecutionPoints(
  periods: readonly ProjectExecutionPoint[]
): ProjectExecutionPoint[] {
  let cumulativePlanned = 0
  let cumulativeLogged = 0

  return periods.map((period) => {
    cumulativePlanned += period.plannedHours
    cumulativeLogged += period.loggedHours
    return {
      ...period,
      plannedHours: roundDisplayStat(cumulativePlanned),
      loggedHours: roundDisplayStat(cumulativeLogged),
    }
  })
}

export function buildPerMonthExecutionPoints(
  monthKeys: readonly string[],
  plannedByMonth: ReadonlyMap<string, number>,
  loggedByMonth: ReadonlyMap<string, number>,
  formatMonthLabel: (monthStartStr: string) => string
): ProjectExecutionPoint[] {
  return monthKeys.map((key) => ({
    periodKey: key,
    periodLabel: formatMonthLabel(key),
    plannedHours: plannedByMonth.get(key) ?? 0,
    loggedHours: loggedByMonth.get(key) ?? 0,
  }))
}

export function aggregateLoggedHoursByDate(
  rows: readonly { log_date: string; logged_seconds: number }[]
): Map<string, number> {
  const byDate = new Map<string, number>()
  for (const row of rows) {
    const hours = Number(row.logged_seconds) / 3600
    byDate.set(row.log_date, (byDate.get(row.log_date) ?? 0) + hours)
  }
  return byDate
}

export function aggregateLoggedHoursByWeek(
  rows: readonly { log_date: string; logged_seconds: number }[]
): Map<string, number> {
  const byWeek = new Map<string, number>()
  for (const row of rows) {
    const logDate = parse(row.log_date, 'yyyy-MM-dd', new Date())
    const weekKey = format(startOfWeek(logDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const hours = Number(row.logged_seconds) / 3600
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + hours)
  }
  return byWeek
}

function monthStartForWeek(weekStartStr: string): string {
  return format(
    startOfMonth(parse(weekStartStr, 'yyyy-MM-dd', new Date())),
    'yyyy-MM-dd'
  )
}

export function formatWeekAxisLabel(weekStartStr: string): string {
  return format(parse(weekStartStr, 'yyyy-MM-dd', new Date()), "MMM ''yy")
}

/** Weekly running totals from project start (build burn-up). */
export function buildWeeklyCumulativeExecutionSeries(params: {
  weekKeys: readonly string[]
  plannedHoursByMonth: ReadonlyMap<string, number>
  loggedHoursByWeek: ReadonlyMap<string, number>
}): ProjectExecutionPoint[] {
  const weeksPerMonth = new Map<string, number>()
  for (const weekKey of params.weekKeys) {
    const monthKey = monthStartForWeek(weekKey)
    weeksPerMonth.set(monthKey, (weeksPerMonth.get(monthKey) ?? 0) + 1)
  }

  let cumulativePlanned = 0
  let cumulativeLogged = 0

  return params.weekKeys.map((weekKey) => {
    const monthKey = monthStartForWeek(weekKey)
    const weeksInMonth = Math.max(1, weeksPerMonth.get(monthKey) ?? 1)
    const monthlyPlanned = params.plannedHoursByMonth.get(monthKey) ?? 0
    cumulativePlanned += monthlyPlanned / weeksInMonth
    cumulativeLogged += params.loggedHoursByWeek.get(weekKey) ?? 0

    return {
      periodKey: weekKey,
      periodLabel: formatWeekAxisLabel(weekKey),
      plannedHours: roundDisplayStat(cumulativePlanned),
      loggedHours: roundDisplayStat(cumulativeLogged),
    }
  })
}

/** Daily running totals within a calendar month (support / internal). */
export function buildDailyCumulativeExecutionSeries(params: {
  monthStartStr: string
  monthEndStr: string
  monthlyPlannedHours: number
  loggedHoursByDate: ReadonlyMap<string, number>
}): ProjectExecutionPoint[] {
  const start = parse(params.monthStartStr, 'yyyy-MM-dd', new Date())
  const end = parse(params.monthEndStr, 'yyyy-MM-dd', new Date())
  const days = eachDayOfInterval({ start, end })
  const dayCount = Math.max(1, days.length)
  const monthlyPlanned = params.monthlyPlannedHours

  let cumulativeLogged = 0

  return days.map((day, index) => {
    const periodKey = format(day, 'yyyy-MM-dd')
    cumulativeLogged += params.loggedHoursByDate.get(periodKey) ?? 0
    const dayFraction = (index + 1) / dayCount
    return {
      periodKey,
      periodLabel: format(day, 'd'),
      plannedHours: roundDisplayStat(monthlyPlanned * dayFraction),
      loggedHours: roundDisplayStat(cumulativeLogged),
    }
  })
}
