import { fragmentationLabelFromFacts } from '@/lib/capacity/planning/planning-metrics'
import { loadMonthFacts } from '@/lib/capacity/planning/load-planning-workspace'
import { resolvePlanningPeriod } from '@/lib/capacity/planning/planning-route-period'
import type {
  PlanningAvailablePerson,
  PlanningMonthPersonFact,
} from '@/lib/capacity/planning/planning-types'
import {
  loadFragmentationByPerson,
  type FragmentationFactRow,
} from '@/lib/data/load-fragmentation-by-person'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { loadPlanningMonthOptions } from '@/lib/capacity/planning/load-planning-month-options'
import {
  DEFAULT_PLANNING_MIN_AVAILABILITY,
  parsePlanningMinAvailabilityParam,
} from '@/lib/capacity/planning/planning-available-people-filters'

export function selectAvailablePeopleFromMonthFacts(
  people: PlanningMonthPersonFact[],
  fragByPerson: Map<string, FragmentationFactRow>,
  params: { minAvailability: number; roleFilter: string | null }
): PlanningAvailablePerson[] {
  return people
    .map((person) => {
      const availableHours = roundDisplayStat(person.netCapacityHours - person.plannedHours)
      if (availableHours < params.minAvailability) return null
      if (params.roleFilter && person.roleLabel !== params.roleFilter) return null
      const frag = fragByPerson.get(person.personId)
      return {
        personId: person.personId,
        personName: person.personName,
        roleLabel: person.roleLabel,
        availableHours,
        projectCount: person.plannedByProject.size,
        fragmentationLabel: fragmentationLabelFromFacts(
          frag?.flagged ?? false,
          frag?.total_count ?? 0
        ),
      }
    })
    .filter((row): row is PlanningAvailablePerson => row != null)
    .sort((a, b) => b.availableHours - a.availableHours)
}

/**
 * Available people for the planning sidebar — same person/month facts as the people grid
 * (`fact_capacity` + `fact_plans` + month role resolution), not raw `fact_bench` rows alone.
 */
export async function loadPlanningAvailablePeople(params: {
  fromParam?: string
  toParam?: string
  peopleMonthParam?: string
  minAvailabilityParam?: string
  roleFilterParam?: string
}): Promise<{
  people: PlanningAvailablePerson[]
  roleOptions: string[]
  selectedMonthKey: string | null
  minAvailability: number
  selectedRole: string
  error: string | null
}> {
  const { options, error: optErr } = await loadPlanningMonthOptions()
  if (optErr) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey: null,
      minAvailability: DEFAULT_PLANNING_MIN_AVAILABILITY,
      selectedRole: '',
      error: optErr,
    }
  }

  const period = resolvePlanningPeriod(options, params.fromParam, params.toParam)
  if (!period) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey: null,
      minAvailability: DEFAULT_PLANNING_MIN_AVAILABILITY,
      selectedRole: '',
      error: null,
    }
  }

  const selectedMonthKey =
    params.peopleMonthParam && period.monthKeys.includes(params.peopleMonthParam)
      ? params.peopleMonthParam
      : (period.monthKeys[1] ?? period.monthKeys[0]) ?? null

  if (!selectedMonthKey) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey: null,
      minAvailability: DEFAULT_PLANNING_MIN_AVAILABILITY,
      selectedRole: '',
      error: null,
    }
  }

  const minAvailability = parsePlanningMinAvailabilityParam(params.minAvailabilityParam)
  const selectedRole = params.roleFilterParam?.trim() ?? ''

  const optionByKey = new Map(options.map((o) => [o.monthKey, o]))
  const monthOpt = optionByKey.get(selectedMonthKey)
  if (!monthOpt) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey,
      minAvailability,
      selectedRole,
      error: `Missing month ${selectedMonthKey}`,
    }
  }

  const monthResult = await loadMonthFacts(
    selectedMonthKey,
    monthOpt.monthStartStr,
    monthOpt.label,
    monthOpt.snapshotId
  )
  if (monthResult.error) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey,
      minAvailability,
      selectedRole,
      error: monthResult.error,
    }
  }
  if (!monthResult.data) {
    return {
      people: [],
      roleOptions: [],
      selectedMonthKey,
      minAvailability,
      selectedRole,
      error: null,
    }
  }

  const roleOptions = Array.from(
    new Set(monthResult.data.people.map((p) => p.roleLabel).filter((label) => label.length > 0))
  ).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

  const fragResult = await loadFragmentationByPerson(monthOpt.snapshotId, monthOpt.monthStartStr)
  if (fragResult.error) {
    return {
      people: [],
      roleOptions,
      selectedMonthKey,
      minAvailability,
      selectedRole,
      error: fragResult.error,
    }
  }

  const people = selectAvailablePeopleFromMonthFacts(monthResult.data.people, fragResult.byPerson, {
    minAvailability,
    roleFilter: selectedRole || null,
  })

  return {
    people,
    roleOptions,
    selectedMonthKey,
    minAvailability,
    selectedRole,
    error: null,
  }
}
