import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { TrainingToolbar } from '@/components/projects/training/training-toolbar'
import { SectionDataError } from '@/components/ui/section-data-states'
import { loadTrainingDashboard } from '@/lib/projects/training/load-training-dashboard'
import type { TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'

export async function TrainingChromeBlock({
  filters,
}: {
  filters: TrainingRouteFilters
}) {
  await connection()
  const { data, monthOptions, error } = await loadTrainingDashboard(filters)
  if (error) return <SectionDataError message={error} />

  const personSuggestions = [
    ...new Set((data?.activities ?? []).map((row) => row.personName).filter(Boolean)),
  ]
    .sort()
    .map((name) => ({ value: name as string, label: name as string }))

  return (
    <DashboardSectionHeader
      title="Training"
      subtitle="MCT learning backlog — hours versus ticket estimate, pulled while idle or on demand. Not a Tempo plan."
      filters={
        <TrainingToolbar
          monthOptions={monthOptions}
          filters={{ ...filters, monthKey: data?.monthKey ?? filters.monthKey }}
          personSuggestions={personSuggestions}
        />
      }
    />
  )
}
