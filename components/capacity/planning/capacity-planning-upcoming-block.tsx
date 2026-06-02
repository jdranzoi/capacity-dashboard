import { connection } from 'next/server'

import { CapacityDataError, CapacityEmptyMonths } from '@/components/capacity/_shared/capacity-data-error'
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
  if (workspaceResult.error) return <CapacityDataError message={workspaceResult.error} />
  if (!workspaceResult.data) return <CapacityEmptyMonths />

  const { upcomingAvailabilityByThreshold, period } = workspaceResult.data

  return (
    <CapacityPlanningUpcomingAvailabilityCard
      availabilityByThreshold={upcomingAvailabilityByThreshold}
      monthKeys={period.monthKeys}
      monthLabels={period.monthLabels}
    />
  )
}
