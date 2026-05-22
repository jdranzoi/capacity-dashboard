import { roundDisplayStat } from '@/lib/format/display-stats'
import { fmtPct } from '@/lib/overview/overview-metrics'
import type { FilterFn } from '@tanstack/react-table'

/** Case-insensitive substring match on string cell values. */
export const filterTextIncludesCi: FilterFn<any> = (row, columnId, filterValue) => {
  const q = String(filterValue ?? '').trim().toLowerCase()
  if (!q) return true
  const v = row.getValue(columnId)
  return String(v ?? '').toLowerCase().includes(q)
}

/** Numeric columns: filter input matches digits in raw value (hours, headcount). */
export const filterNumberContains: FilterFn<any> = (row, columnId, filterValue) => {
  const q = String(filterValue ?? '').trim().toLowerCase()
  if (!q) return true
  const v = row.getValue(columnId)
  if (v == null) return false
  return String(v).includes(q)
}

/** Percent columns: match rounded integer or formatted label (e.g. `72`, `72%`). */
export const filterPctContains: FilterFn<any> = (row, columnId, filterValue) => {
  const q = String(filterValue ?? '')
    .trim()
    .toLowerCase()
    .replace(/%/g, '')
    .trim()
  if (!q) return true
  const v = row.getValue(columnId) as number | null
  if (v == null) return false
  const rounded = String(roundDisplayStat(v))
  return rounded.includes(q) || fmtPct(v).toLowerCase().includes(q)
}
