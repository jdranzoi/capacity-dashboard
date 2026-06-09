import { plannedPct } from '@/lib/domain/workload-metrics'

export type PlannedUtilizationBand = 'all' | 'lt40' | 'lt60' | 'lt80' | 'gt80'

export const PLANNED_UTILIZATION_BAND_OPTIONS: readonly {
  value: PlannedUtilizationBand
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'lt40', label: '<40' },
  { value: 'lt60', label: '<60' },
  { value: 'lt80', label: '<80' },
  { value: 'gt80', label: '>80' },
]

export const PLANNED_UTILIZATION_LT_BANDS = ['lt40', 'lt60', 'lt80'] as const satisfies readonly PlannedUtilizationBand[]

export type PlannedUtilizationLtBand = (typeof PLANNED_UTILIZATION_LT_BANDS)[number]

export const PLANNED_UTILIZATION_LT_THRESHOLD_PCT: Record<PlannedUtilizationLtBand, number> = {
  lt40: 40,
  lt60: 60,
  lt80: 80,
}

export const DEFAULT_PLANNED_UTILIZATION_BAND_FILTER: PlannedUtilizationBand = 'all'

/** Upcoming Availability sidebar — staffing headroom default. */
export const DEFAULT_PLANNED_UTILIZATION_BAND_AVAILABILITY: PlannedUtilizationBand = 'lt60'

export function isPlannedUtilizationLtBand(
  band: PlannedUtilizationBand
): band is PlannedUtilizationLtBand {
  return band === 'lt40' || band === 'lt60' || band === 'lt80'
}

export function plannedUtilizationLtThresholdPct(band: PlannedUtilizationLtBand): number {
  return PLANNED_UTILIZATION_LT_THRESHOLD_PCT[band]
}

/** Planned utilization band match (plan ÷ net capacity). */
export function matchesPlannedUtilizationBand(
  pct: number | null,
  band: PlannedUtilizationBand
): boolean {
  if (band === 'all') return true
  if (pct == null) return false
  if (band === 'lt40') return pct < 40
  if (band === 'lt60') return pct < 60
  if (band === 'lt80') return pct < 80
  return pct > 80
}

export function personMatchesPlannedUtilizationBand(
  person: { plannedHours: number; netCapacityHours: number },
  band: PlannedUtilizationBand
): boolean {
  if (band === 'all') return true
  return matchesPlannedUtilizationBand(
    plannedPct(person.plannedHours, person.netCapacityHours),
    band
  )
}

/** Sidebar / panel copy for the selected utilization band. */
export function plannedUtilizationBandDescription(band: PlannedUtilizationBand): string {
  if (band === 'all') {
    return 'Role headcount across the period (all utilization levels).'
  }
  if (band === 'gt80') {
    return 'Roles with people over 80% planned utilization (plan ÷ net).'
  }
  const pct = PLANNED_UTILIZATION_LT_THRESHOLD_PCT[band]
  return `Roles with people under ${pct}% planned utilization (plan ÷ net).`
}
