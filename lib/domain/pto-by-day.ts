/**
 * PTO hours per person and working day (D-030), mirroring the capacity-mcp sync
 * (`sync/capacity.ts` `ptoHoursByDay`, `sync/plan-days.ts` `expandPlanDays`):
 *
 * - Days before the cutoff use logged HR worklogs; days on or after it use the
 *   HR plan items in `fact_pto_plan`. The cutoff is the day the snapshot ran,
 *   so a closed month resolved after its end is entirely logged.
 * - Only working days count (weekdays that are not holidays of the person's zone).
 * - Each day is capped at one standard workday.
 *
 * Summed over the month this equals `fact_capacity.pto_hours` for the same snapshot.
 * Dates are ISO `yyyy-MM-dd` strings handled in UTC.
 */

import { STANDARD_WORKDAY_HOURS } from '@/lib/domain/workload-metrics'

export type PtoPlanItem = {
  person_id: string
  start_date: string
  end_date: string
  hours_per_day: number
  rule: string | null
  recurrence_end_date: string | null
}

export type PtoDayRow = {
  person_id: string
  date: string
  hours: number
}

const MAX_OCCURRENCES = 1000

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function formatIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDaysIso(iso: string, days: number): string {
  const d = parseIso(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return formatIso(d)
}

/** Same day next month(s), clamped to the last day of the target month. */
function addMonthsIso(iso: string, months: number): string {
  const d = parseIso(iso)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return formatIso(d)
}

function eachDayIso(from: string, to: string): string[] {
  const out: string[] = []
  for (let cur = from; cur <= to; cur = addDaysIso(cur, 1)) out.push(cur)
  return out
}

function isWeekdayIso(iso: string): boolean {
  const dow = parseIso(iso).getUTCDay()
  return dow !== 0 && dow !== 6
}

function shiftOccurrence(iso: string, rule: string, k: number): string | null {
  switch (rule) {
    case 'WEEKLY':
      return addDaysIso(iso, 7 * k)
    case 'BI_WEEKLY':
      return addDaysIso(iso, 14 * k)
    case 'MONTHLY':
      return addMonthsIso(iso, k)
    default:
      return null
  }
}

/**
 * Calendar days a Tempo plan covers inside `window`. A recurring plan repeats its
 * start..end span every week, two weeks or month until `recurrence_end_date`.
 * Working-day filtering happens in `ptoHoursByPersonDay`.
 */
function planDaysInWindow(plan: PtoPlanItem, window: { from: string; to: string }): string[] {
  const rule = plan.rule ?? 'NEVER'
  const recurring = rule !== 'NEVER' && Boolean(plan.recurrence_end_date)
  const lastDay = recurring ? plan.recurrence_end_date! : plan.end_date
  const spanDays = eachDayIso(plan.start_date, plan.end_date).length

  const days = new Set<string>()
  for (let k = 0; k < (recurring ? MAX_OCCURRENCES : 1); k += 1) {
    const occStart = k === 0 ? plan.start_date : shiftOccurrence(plan.start_date, rule, k)
    if (!occStart || occStart > lastDay || occStart > window.to) break
    const occEnd = addDaysIso(occStart, spanDays - 1)
    const from = occStart > window.from ? occStart : window.from
    const capEnd = occEnd < lastDay ? occEnd : lastDay
    const to = capEnd < window.to ? capEnd : window.to
    if (from <= to) for (const day of eachDayIso(from, to)) days.add(day)
  }
  return [...days]
}

export function ptoHoursByPersonDay(args: {
  monthStart: string
  monthEnd: string
  /** First day that reads planned PTO instead of logged PTO. */
  cutoffDate: string
  personIds: Iterable<string>
  zoneIdByPerson: ReadonlyMap<string, string | null>
  holidaysByZone: ReadonlyMap<string, ReadonlySet<string>>
  loggedPto: readonly { person_id: string; log_date: string; logged_seconds: number }[]
  plannedPto: readonly PtoPlanItem[]
}): PtoDayRow[] {
  const window = { from: args.monthStart, to: args.monthEnd }

  const logged = new Map<string, number>()
  for (const r of args.loggedPto) {
    if (r.log_date >= args.cutoffDate) continue
    const key = `${r.person_id}|${r.log_date}`
    logged.set(key, (logged.get(key) ?? 0) + Number(r.logged_seconds) / 3600)
  }

  const planned = new Map<string, number>()
  for (const plan of args.plannedPto) {
    const hours = Number(plan.hours_per_day)
    if (!(hours > 0)) continue
    for (const day of planDaysInWindow(plan, window)) {
      if (day < args.cutoffDate) continue
      const key = `${plan.person_id}|${day}`
      planned.set(key, (planned.get(key) ?? 0) + hours)
    }
  }

  const noHolidays: ReadonlySet<string> = new Set()
  const monthDays = eachDayIso(args.monthStart, args.monthEnd).filter(isWeekdayIso)
  const out: PtoDayRow[] = []
  for (const personId of args.personIds) {
    const zoneId = args.zoneIdByPerson.get(personId) ?? null
    const holidays = (zoneId != null && args.holidaysByZone.get(zoneId)) || noHolidays
    for (const day of monthDays) {
      if (holidays.has(day)) continue
      const key = `${personId}|${day}`
      const source = day < args.cutoffDate ? logged : planned
      const hours = Math.min(STANDARD_WORKDAY_HOURS, source.get(key) ?? 0)
      if (hours > 0) out.push({ person_id: personId, date: day, hours })
    }
  }
  return out
}
