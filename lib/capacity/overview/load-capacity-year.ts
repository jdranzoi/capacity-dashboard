import { buildCapacityYear } from '@/lib/capacity/overview/build-capacity-year'
import { loadCapacityYearFacts } from '@/lib/capacity/overview/load-capacity-year-facts'
import type { CapacityYearPayload } from '@/lib/capacity/overview/capacity-year-types'
import { loadProjectTypes } from '@/lib/data/load-project-types'

export async function loadCapacityYear(now?: Date): Promise<{
  data: CapacityYearPayload | null
  error: string | null
}> {
  const [facts, projectTypes] = await Promise.all([loadCapacityYearFacts(), loadProjectTypes()])
  if (facts.error) {
    return { data: null, error: facts.error }
  }
  if (projectTypes.error) {
    return { data: null, error: projectTypes.error }
  }
  if (!facts.data || facts.data.ops.length === 0) {
    return { data: null, error: null }
  }
  return { data: buildCapacityYear(facts.data, projectTypes.types, now), error: null }
}
