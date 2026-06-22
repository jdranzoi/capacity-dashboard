'use client'

import { useCapacityRoutePending } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { useOverviewRoutePending } from '@/components/overview/overview-route-pending-shell'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { useTeamsRoutePending } from '@/components/teams/_shared/teams-route-pending-shell'
import type { SectionRoutePendingValue } from '@/components/ui/section-route-pending'

/** First non-null pending context from the active section layout shell. */
export function useResolvedSectionRoutePending(
  override?: SectionRoutePendingValue | null
): SectionRoutePendingValue | null {
  const capacity = useCapacityRoutePending()
  const teams = useTeamsRoutePending()
  const projects = useProjectsRoutePending()
  const overview = useOverviewRoutePending()
  return override ?? capacity ?? teams ?? projects ?? overview
}
