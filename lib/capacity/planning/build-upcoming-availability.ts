import { plannedPct } from '@/lib/domain/workload-metrics'
import { PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT } from '@/lib/capacity/planning/planning-upcoming-availability-config'
import type {
  PlanningAvailabilityEvent,
  PlanningMonthFacts,
  PlanningMonthPersonFact,
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
  maxPlannedUtilPct: number = PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT
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
