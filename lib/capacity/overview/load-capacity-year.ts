import { buildCapacityYear } from '@/lib/capacity/overview/build-capacity-year'
import { loadCapacityYearFacts } from '@/lib/capacity/overview/load-capacity-year-facts'
import type { CapacityYearPayload } from '@/lib/capacity/overview/capacity-year-types'

export async function loadCapacityYear(now?: Date): Promise<{
  data: CapacityYearPayload | null
  error: string | null
}> {
  const facts = await loadCapacityYearFacts()
  if (facts.error) {
    return { data: null, error: facts.error }
  }
  if (!facts.data || facts.data.ops.length === 0) {
    return { data: null, error: null }
  }
  return { data: buildCapacityYear(facts.data, now), error: null }
}
