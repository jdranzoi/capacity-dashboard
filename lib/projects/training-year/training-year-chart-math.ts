import { fmtHeadcountKpi, fmtHoursKpi } from '@/lib/overview/overview-metrics'
import type { TrainingYearChartUnit } from '@/lib/projects/training-year/training-year-types'

export function formatBarValue(unit: TrainingYearChartUnit, value: number): string {
  return unit === 'hours' ? fmtHoursKpi(value) : fmtHeadcountKpi(value)
}

export function formatAxisTick(unit: TrainingYearChartUnit, value: number): string {
  if (value === 0) return unit === 'hours' ? '0h' : '0'
  return formatBarValue(unit, value)
}

export function niceIntegerScale(maxValue: number): { domainMax: number; ticks: number[] } {
  const raw = Math.max(1, Math.ceil(maxValue))
  const rough = raw / 4
  const exp = 10 ** Math.max(0, Math.floor(Math.log10(rough)))
  const err = rough / exp
  const niceFrac = err <= 1 ? 1 : err <= 2 ? 2 : err <= 5 ? 5 : 10
  const step = niceFrac * exp
  const domainMax = step * Math.ceil(raw / step)
  const ticks: number[] = []
  for (let tick = 0; tick <= domainMax + 1e-9; tick += step) {
    ticks.push(tick)
  }
  return { domainMax, ticks }
}

/** Current year is strongest; older years step down in the same hue. */
export function yearFillOpacity(year: number, currentYear: number, years: number[]): number {
  if (year === currentYear) return 0.92
  const older = years.filter((item) => item < currentYear).sort((a, b) => b - a)
  const index = older.indexOf(year)
  if (index === -1) return 0.5
  return Math.max(0.22, 0.58 - index * 0.18)
}
