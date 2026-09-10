import { connection } from 'next/server'

import { TrainingKpiRow } from '@/components/projects/training/training-kpi-row'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { loadTrainingDashboard } from '@/lib/projects/training/load-training-dashboard'
import type { TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'

export async function TrainingKpiBlock({
  filters,
}: {
  filters: TrainingRouteFilters
}) {
  await connection()
  const { data, error } = await loadTrainingDashboard(filters)
  if (error) return <SectionDataError message={error} />
  if (!data) {
    return (
      <SectionEmptyState message="No MCT training issues yet. Apply migration 024 and run npm run sync:training." />
    )
  }
  return <TrainingKpiRow kpis={data.kpis} />
}
