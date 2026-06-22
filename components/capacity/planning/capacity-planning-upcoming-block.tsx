import { connection } from 'next/server'

import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { CapacityPlanningUpcomingAvailabilityCard } from '@/components/capacity/planning/capacity-planning-upcoming-availability-card'
import { loadPlanningWorkspaceCached } from '@/lib/capacity/planning/load-planning-workspace'

export async function CapacityPlanningUpcomingBlock({
  fromParam,
  toParam,
}: {
  fromParam?: string
  toParam?: string
}) {
  await connection()

  const workspaceResult = await loadPlanningWorkspaceCached(fromParam, toParam)
  if (workspaceResult.error) return <SectionDataError message={workspaceResult.error} />
  if (!workspaceResult.data) return <SectionEmptyState />

  const { upcomingAvailabilityByBand, period } = workspaceResult.data

  return (
    <CapacityPlanningUpcomingAvailabilityCard
      availabilityByBand={upcomingAvailabilityByBand}
      monthKeys={period.monthKeys}
      monthLabels={period.monthLabels}
    />
  )
}
