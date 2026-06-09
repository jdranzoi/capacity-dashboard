import {
  PLANNED_UTILIZATION_BAND_OPTIONS,
  personMatchesPlannedUtilizationBand,
  type PlannedUtilizationBand,
} from '@/lib/domain/planned-utilization-band'
import type {
  PlanningAvailabilityEvent,
  PlanningMonthFacts,
  PlanningUpcomingAvailabilityByBand,
} from '@/lib/capacity/planning/planning-types'

type RoleHeadcountRollup = {
  roleKey: string
  roleLabel: string
  headcount: number
}

export function planningRoleAvailabilityCode(roleKey: string): string {
  return roleKey.toUpperCase()
}

/**
 * Per month and role: count people matching the utilization band
 * (same plan ÷ net definition as the people grid utilization filter).
 */
export function buildUpcomingAvailability(
  monthFacts: PlanningMonthFacts[],
  periodLabels: Record<string, string>,
  band: PlannedUtilizationBand
): PlanningAvailabilityEvent[] {
  const events: PlanningAvailabilityEvent[] = []

  for (const month of monthFacts) {
    const byRole = new Map<string, RoleHeadcountRollup>()

    for (const person of month.people) {
      if (!person.roleId || !person.roleKey) continue
      if (!personMatchesPlannedUtilizationBand(person, band)) continue

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

export function buildUpcomingAvailabilityByBand(
  monthFacts: PlanningMonthFacts[],
  periodLabels: Record<string, string>
): PlanningUpcomingAvailabilityByBand {
  return Object.fromEntries(
    PLANNED_UTILIZATION_BAND_OPTIONS.map((option) => [
      option.value,
      buildUpcomingAvailability(monthFacts, periodLabels, option.value),
    ])
  ) as PlanningUpcomingAvailabilityByBand
}
