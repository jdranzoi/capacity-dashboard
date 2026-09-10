import { cache } from 'react'

import { buildTrainingYearDashboard } from '@/lib/projects/training-year/build-training-year'
import { loadTrainingYearFacts } from '@/lib/projects/training-year/load-training-year-facts'
import type { TrainingYearFilters } from '@/lib/projects/training-year/training-year-filters'
import type { TrainingYearPayload } from '@/lib/projects/training-year/training-year-types'

export const loadTrainingYearDashboard = cache(async function loadTrainingYearDashboard(
  filters: TrainingYearFilters
): Promise<{ data: TrainingYearPayload | null; error: string | null }> {
  const facts = await loadTrainingYearFacts()
  if (facts.error) return { data: null, error: facts.error }
  if (!facts.data) return { data: null, error: 'No training data' }

  const year = new Date().getFullYear()
  return { data: buildTrainingYearDashboard(facts.data, year, filters), error: null }
})
