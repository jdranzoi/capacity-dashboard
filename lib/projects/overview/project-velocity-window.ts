import { addDays, format, min as minDate, parse, startOfDay, startOfWeek, subWeeks } from 'date-fns'

import { weekStartsInRange } from '@/lib/projects/overview/load-project-grain-data'

export type ProjectVelocityWindow = {
  weekStartStrs: string[]
  queryStartStr: string
  queryEndStr: string
}

const WEEK_STARTS_ON = 1
const BUILD_TRAILING_WEEKS = 6

function weekEndStr(weekStartStr: string): string {
  return format(addDays(parse(weekStartStr, 'yyyy-MM-dd', new Date()), 6), 'yyyy-MM-dd')
}

/** ISO weeks that overlap the selected calendar month (support / product / internal). */
export function monthlyVelocityWindow(monthStartStr: string, monthEndStr: string): ProjectVelocityWindow {
  const weekStartStrs = weekStartsInRange(monthStartStr, monthEndStr)
  const first = weekStartStrs[0] ?? monthStartStr
  const last = weekStartStrs[weekStartStrs.length - 1] ?? monthEndStr

  return {
    weekStartStrs,
    queryStartStr: first,
    queryEndStr: weekEndStr(last),
  }
}

/** Last 6 ISO weeks through min(today, project end). */
export function buildVelocityWindow(
  projectEndDate: string | null,
  asOf: Date = new Date()
): ProjectVelocityWindow {
  const today = startOfDay(asOf)
  const endCap =
    projectEndDate != null
      ? minDate([today, startOfDay(parse(projectEndDate, 'yyyy-MM-dd', asOf))])
      : today
  const lastWeekStart = startOfWeek(endCap, { weekStartsOn: WEEK_STARTS_ON })
  const weekStartStrs = Array.from({ length: BUILD_TRAILING_WEEKS }, (_, index) =>
    format(subWeeks(lastWeekStart, BUILD_TRAILING_WEEKS - 1 - index), 'yyyy-MM-dd')
  )
  const first = weekStartStrs[0]!
  const last = weekStartStrs[weekStartStrs.length - 1]!

  return {
    weekStartStrs,
    queryStartStr: first,
    queryEndStr: weekEndStr(last),
  }
}

export function resolveProjectVelocityWindow(params: {
  isBuild: boolean
  monthStartStr: string
  monthEndStr: string
  projectEndDate: string | null
  asOf?: Date
}): ProjectVelocityWindow {
  if (params.isBuild) {
    return buildVelocityWindow(params.projectEndDate, params.asOf)
  }
  return monthlyVelocityWindow(params.monthStartStr, params.monthEndStr)
}
