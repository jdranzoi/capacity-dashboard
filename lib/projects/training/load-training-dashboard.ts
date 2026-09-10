import { cache } from 'react'

import { loadOverviewMonthOptions, resolveSelectedOverviewMonth } from '@/lib/overview/overview-month-options'
import { buildTrainingDashboard } from '@/lib/projects/training/build-training-dashboard'
import { loadTrainingFacts } from '@/lib/projects/training/load-training-facts'
import type { TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'
import type { TrainingDashboardPayload } from '@/lib/projects/training/training-types'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export const loadTrainingDashboard = cache(async function loadTrainingDashboard(
  filters: TrainingRouteFilters
): Promise<{
  data: TrainingDashboardPayload | null
  monthOptions: OverviewMonthOption[]
  error: string | null
}> {
  const [months, facts] = await Promise.all([
    loadOverviewMonthOptions(),
    loadTrainingFacts(),
  ])

  if (months.error) return { data: null, monthOptions: [], error: months.error }
  if (facts.error) return { data: null, monthOptions: months.options, error: facts.error }
  if (!facts.data) return { data: null, monthOptions: months.options, error: 'No training data' }

  const selected = resolveSelectedOverviewMonth(months.options, filters.monthKey ?? undefined)
  const monthKey = selected?.monthKey ?? filters.monthKey ?? new Date().toISOString().slice(0, 7)

  return {
    data: buildTrainingDashboard({
      issues: facts.data.issues,
      worklogs: facts.data.worklogs,
      personNameById: new Map(facts.data.personNames.map((person) => [person.id, person.name])),
      filters,
      monthKey,
    }),
    monthOptions: months.options,
    error: null,
  }
})
