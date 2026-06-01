import { fmtHoursKpi } from '@/lib/overview/overview-metrics'

/** Shared SVG chart typography (detail panel charts). */
export const PROJECT_CHART_AXIS_FONT_PX = 9
export const PROJECT_CHART_VALUE_FONT_PX = 8
export const PROJECT_CHART_AXIS_CLASS = 'fill-muted-foreground'
export const PROJECT_CHART_VALUE_CLASS = 'fill-foreground'
export const PROJECT_CHART_LEGEND_CLASS = 'text-[0.6rem] leading-none text-muted-foreground'

/** User-visible hours label on top of a bar. */
export function formatBarHoursLabel(hours: number): string {
  if (hours <= 0) return ''
  return fmtHoursKpi(hours)
}

export function formatYAxisTickHours(hours: number): string {
  if (hours === 0) return '0'
  if (hours >= 1000) return `${Math.round(hours / 100) / 10}k`
  return `${Math.round(hours)}`
}
