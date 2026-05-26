/** Min open-hours thresholds for the planning "Available People" sidebar. */
export const PLANNING_MIN_AVAILABILITY_HOURS = [10, 20, 30, 40, 50, 60] as const

export const DEFAULT_PLANNING_MIN_AVAILABILITY = 20

export function parsePlanningMinAvailabilityParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_PLANNING_MIN_AVAILABILITY), 10)
  if (!Number.isFinite(parsed)) return DEFAULT_PLANNING_MIN_AVAILABILITY
  if ((PLANNING_MIN_AVAILABILITY_HOURS as readonly number[]).includes(parsed)) return parsed
  return DEFAULT_PLANNING_MIN_AVAILABILITY
}
