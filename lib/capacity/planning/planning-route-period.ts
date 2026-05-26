import { format, startOfMonth } from 'date-fns'

import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { PlanningPeriod, PlanningView } from '@/lib/capacity/planning/planning-types'

/** Inclusive range length: current month + 3 forward months (e.g. May–Aug). */
const MAX_MONTHS_IN_RANGE = 4

export function parsePlanningView(raw: string | string[] | undefined): PlanningView {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'project' ? 'project' : 'people'
}

function monthKeyFromParam(raw: string | undefined): string | null {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return null
  return raw
}

function sortOptionsChronologically(options: OverviewMonthOption[]): OverviewMonthOption[] {
  return [...options].sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

function currentMonthKey(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM')
}

function defaultFromKey(chron: OverviewMonthOption[]): string {
  if (chron.length === 0) return currentMonthKey()
  const currentKey = currentMonthKey()
  const inRange = chron.find((o) => o.monthKey === currentKey)
  if (inRange) return inRange.monthKey
  return chron[0]!.monthKey
}

function defaultToKey(chron: OverviewMonthOption[], fromKey: string): string {
  const fromIdx = chron.findIndex((o) => o.monthKey === fromKey)
  if (fromIdx < 0) return fromKey
  const endIdx = Math.min(fromIdx + MAX_MONTHS_IN_RANGE - 1, chron.length - 1)
  return chron[endIdx]!.monthKey
}

export function resolvePlanningPeriod(
  options: OverviewMonthOption[],
  fromParam: string | undefined,
  toParam: string | undefined
): PlanningPeriod | null {
  if (options.length === 0) return null

  const chron = sortOptionsChronologically(options)
  const optionKeys = new Set(chron.map((o) => o.monthKey))
  const labels = Object.fromEntries(chron.map((o) => [o.monthKey, o.label]))

  let fromKey = monthKeyFromParam(fromParam)
  if (!fromKey || !optionKeys.has(fromKey)) {
    fromKey = defaultFromKey(chron)
  }

  let toKey = monthKeyFromParam(toParam)
  if (!toKey || !optionKeys.has(toKey)) {
    toKey = defaultToKey(chron, fromKey)
  }

  if (fromKey > toKey) {
    ;[fromKey, toKey] = [toKey, fromKey]
  }

  const fromIdx = chron.findIndex((o) => o.monthKey === fromKey)
  const toIdx = chron.findIndex((o) => o.monthKey === toKey)
  if (fromIdx < 0 || toIdx < 0) return null

  const sliceEnd = Math.min(toIdx, fromIdx + MAX_MONTHS_IN_RANGE - 1)
  const monthKeys = chron.slice(fromIdx, sliceEnd + 1).map((o) => o.monthKey)
  const resolvedTo = monthKeys[monthKeys.length - 1]!

  return {
    fromMonthKey: fromKey,
    toMonthKey: resolvedTo,
    monthKeys,
    monthLabels: Object.fromEntries(monthKeys.map((k) => [k, labels[k] ?? k])),
  }
}
