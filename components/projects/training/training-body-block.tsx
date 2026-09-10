import { connection } from 'next/server'

import { TrainingActivityTable } from '@/components/projects/training/training-activity-table'
import { TrainingTaxonomyTable } from '@/components/projects/training/training-taxonomy-table'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { loadTrainingDashboard } from '@/lib/projects/training/load-training-dashboard'
import type { TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'

export async function TrainingBodyBlock({
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

  return (
    <div className="flex flex-col gap-6" data-slot="training-body">
      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <TrainingTaxonomyTable
          title="Versions"
          description="Fix versions / releases. Click a name to filter the area grid."
          rows={data.versions}
          paramKey="version"
          selectedKey={filters.versionKey}
        />
        <TrainingTaxonomyTable
          title="Areas"
          description="Components in the selected version. Click a name to filter the topic grid."
          rows={data.components}
          paramKey="component"
          selectedKey={filters.componentKey}
        />
        <TrainingTaxonomyTable
          title="Topics"
          description="Labels in the selected area. Click a name to filter activities."
          rows={data.labels}
          paramKey="topic"
          selectedKey={filters.topicKey}
        />
      </div>
      <TrainingActivityTable rows={data.activities} />
    </div>
  )
}
