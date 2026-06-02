import { plannedPct } from '@/lib/domain/workload-metrics'
import {
  PLANNING_UPCOMING_DEFAULT_UTIL_THRESHOLD,
  PLANNING_UPCOMING_UTIL_THRESHOLDS,
  PLANNING_UPCOMING_UTIL_THRESHOLD_PCT,
  planningUpcomingUtilThresholdPct,
} from '@/lib/capacity/planning/planning-upcoming-availability-config'
import type {
  PlanningAvailabilityEvent,
  PlanningMonthFacts,
  PlanningMonthPersonFact,
  PlanningUpcomingAvailabilityByThreshold,
} from '@/lib/capacity/planning/planning-types'

type RoleHeadcountRollup = {
  roleKey: string
  roleLabel: string
  headcount: number
}

export function planningRoleAvailabilityCode(roleKey: string): string {
  return roleKey.toUpperCase()
}

export function personBelowPlannedUtilizationThreshold(
  person: PlanningMonthPersonFact,
  maxPlannedUtilPct: number
): boolean {
  const util = plannedPct(person.plannedHours, person.netCapacityHours)
  if (util == null) return false
  return util < maxPlannedUtilPct
}

/**
 * Per month and role: count people whose planned utilization is below the threshold
 * (same plan ÷ net definition as the people grid utilization bands).
 */
export function buildUpcomingAvailability(
  monthFacts: PlanningMonthFacts[],
  periodLabels: Record<string, string>,
  maxPlannedUtilPct: number = planningUpcomingUtilThresholdPct(
    PLANNING_UPCOMING_DEFAULT_UTIL_THRESHOLD
  )
): PlanningAvailabilityEvent[] {
  const events: PlanningAvailabilityEvent[] = []

  for (const month of monthFacts) {
    const byRole = new Map<string, RoleHeadcountRollup>()

    for (const person of month.people) {
      if (!person.roleId || !person.roleKey) continue
      if (!personBelowPlannedUtilizationThreshold(person, maxPlannedUtilPct)) continue

      const key = person.roleKey
      let agg = byRole.get(key)
      if (!agg) {
        agg = {
          roleKey: key,
          roleLabel: person.roleLabel,
          headcount: 0,
        }
        byRole.set(key, agg)
      }
      agg.headcount += 1
    }

    const monthLabel = periodLabels[month.monthKey] ?? month.monthLabel
    const rollups = Array.from(byRole.values()).sort((a, b) => {
      if (b.headcount !== a.headcount) return b.headcount - a.headcount
      return a.roleLabel.localeCompare(b.roleLabel, 'en', { sensitivity: 'base' })
    })

    for (const agg of rollups) {
      events.push({
        monthKey: month.monthKey,
        monthLabel,
        roleCode: planningRoleAvailabilityCode(agg.roleKey),
        roleLabel: agg.roleLabel,
        headcount: agg.headcount,
      })
    }
  }

  return events
}

export function buildUpcomingAvailabilityByThreshold(
  monthFacts: PlanningMonthFacts[],
  periodLabels: Record<string, string>
): PlanningUpcomingAvailabilityByThreshold {
  return Object.fromEntries(
    PLANNING_UPCOMING_UTIL_THRESHOLDS.map((threshold) => [
      threshold,
      buildUpcomingAvailability(
        monthFacts,
        periodLabels,
        PLANNING_UPCOMING_UTIL_THRESHOLD_PCT[threshold]
      ),
    ])
  ) as PlanningUpcomingAvailabilityByThreshold
}
