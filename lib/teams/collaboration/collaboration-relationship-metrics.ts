import { addMonths, format, parse, startOfMonth } from 'date-fns'

import type { CollaborationProjectRef } from '@/lib/teams/collaboration/collaboration-types'

const CATEGORY_ALL = 'all'

export type MonthProjectMembers = Map<string, Map<string, Set<string>>>

export type CollaborationEdgeRelationshipMetrics = {
  isFutureFilter: boolean
  periodStartDate: string | null
  sharedProjectsInRange: number
  currentMonthProjects: number
}

export function calendarCurrentMonthKey(asOf: Date = new Date()): string {
  return format(startOfMonth(asOf), 'yyyy-MM')
}

export function collaborationHorizonEndMonthKey(asOf: Date = new Date(), monthsAfter: number): string {
  return format(addMonths(startOfMonth(asOf), monthsAfter), 'yyyy-MM')
}

export function monthKeysInclusive(startKey: string, endKey: string): string[] {
  if (startKey > endKey) return []

  const keys: string[] = []
  let cursor = parse(`${startKey}-01`, 'yyyy-MM-dd', new Date())
  const end = parse(`${endKey}-01`, 'yyyy-MM-dd', new Date())

  while (cursor <= end) {
    keys.push(format(cursor, 'yyyy-MM'))
    cursor = addMonths(cursor, 1)
  }

  return keys
}

export function collectRelationshipMetricsMonthKeys(input: {
  filterMonthKey: string
  currentMonthKey: string
  horizonEndMonthKey: string
  availableMonthKeys: Set<string>
}): string[] {
  const { filterMonthKey, currentMonthKey, horizonEndMonthKey, availableMonthKeys } = input
  const keys = new Set<string>()

  keys.add(currentMonthKey)

  if (filterMonthKey > currentMonthKey) {
    for (const monthKey of monthKeysInclusive(filterMonthKey, horizonEndMonthKey)) {
      if (availableMonthKeys.has(monthKey)) keys.add(monthKey)
    }
  } else {
    for (const monthKey of monthKeysInclusive(filterMonthKey, currentMonthKey)) {
      if (availableMonthKeys.has(monthKey)) keys.add(monthKey)
    }
  }

  return Array.from(keys)
}

export function buildMonthProjectMembers(
  plansByMonth: Map<string, { person_id: string; project_id: string }[]>
): MonthProjectMembers {
  const membersByMonth: MonthProjectMembers = new Map()

  for (const [monthKey, rows] of plansByMonth) {
    const byProject = new Map<string, Set<string>>()

    for (const row of rows) {
      if (!row.person_id || !row.project_id) continue
      const members = byProject.get(row.project_id)
      if (members) {
        members.add(row.person_id)
      } else {
        byProject.set(row.project_id, new Set([row.person_id]))
      }
    }

    membersByMonth.set(monthKey, byProject)
  }

  return membersByMonth
}

function projectInScope(
  projectId: string,
  projectsById: Map<string, CollaborationProjectRef>,
  category: string
): boolean {
  const project = projectsById.get(projectId)
  if (!project) return false
  if (category === CATEGORY_ALL) return true
  return project.type === category
}

function sharedProjectIdsForMonths(
  personA: string,
  personB: string,
  monthKeys: string[],
  membersByMonth: MonthProjectMembers,
  projectsById: Map<string, CollaborationProjectRef>,
  category: string
): Set<string> {
  const shared = new Set<string>()

  for (const monthKey of monthKeys) {
    const byProject = membersByMonth.get(monthKey)
    if (!byProject) continue

    for (const [projectId, members] of byProject) {
      if (!projectInScope(projectId, projectsById, category)) continue
      if (members.has(personA) && members.has(personB)) shared.add(projectId)
    }
  }

  return shared
}

function earliestSharedMonthKey(
  personA: string,
  personB: string,
  monthKeys: string[],
  membersByMonth: MonthProjectMembers,
  projectsById: Map<string, CollaborationProjectRef>,
  category: string
): string | null {
  for (const monthKey of monthKeys) {
    const byProject = membersByMonth.get(monthKey)
    if (!byProject) continue

    for (const [projectId, members] of byProject) {
      if (!projectInScope(projectId, projectsById, category)) continue
      if (members.has(personA) && members.has(personB)) return monthKey
    }
  }

  return null
}

export function computeEdgeRelationshipMetrics(input: {
  personA: string
  personB: string
  membersByMonth: MonthProjectMembers
  projectsById: Map<string, CollaborationProjectRef>
  category: string
  filterMonthKey: string
  currentMonthKey: string
  horizonEndMonthKey: string
}): CollaborationEdgeRelationshipMetrics {
  const {
    personA,
    personB,
    membersByMonth,
    projectsById,
    category,
    filterMonthKey,
    currentMonthKey,
    horizonEndMonthKey,
  } = input

  const currentMonthProjects = sharedProjectIdsForMonths(
    personA,
    personB,
    [currentMonthKey],
    membersByMonth,
    projectsById,
    category
  ).size

  if (filterMonthKey > currentMonthKey) {
    const futureMonths = monthKeysInclusive(filterMonthKey, horizonEndMonthKey)
    return {
      isFutureFilter: true,
      periodStartDate: `${filterMonthKey}-01`,
      sharedProjectsInRange: sharedProjectIdsForMonths(
        personA,
        personB,
        futureMonths,
        membersByMonth,
        projectsById,
        category
      ).size,
      currentMonthProjects,
    }
  }

  const rangeMonths = monthKeysInclusive(filterMonthKey, currentMonthKey)
  const earliestMonthKey = earliestSharedMonthKey(
    personA,
    personB,
    rangeMonths,
    membersByMonth,
    projectsById,
    category
  )

  return {
    isFutureFilter: false,
    periodStartDate: earliestMonthKey ? `${earliestMonthKey}-01` : null,
    sharedProjectsInRange: sharedProjectIdsForMonths(
      personA,
      personB,
      rangeMonths,
      membersByMonth,
      projectsById,
      category
    ).size,
    currentMonthProjects,
  }
}
