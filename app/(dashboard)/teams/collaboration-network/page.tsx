import { Suspense } from 'react'

import { CollaborationNetworkBlock } from '@/components/teams/collaboration/collaboration-network-block'
import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-section'
import {
  TeamsCollaborationPageSkeleton,
  TeamsCollaborationSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { parseCollaborationRouteFilters } from '@/lib/teams/collaboration/collaboration-route-filters'

type CollaborationNetworkPageProps = {
  searchParams: Promise<{
    month?: string
    category?: string
    q?: string
  }>
}

export default function CollaborationNetworkPage({
  searchParams,
}: CollaborationNetworkPageProps) {
  return (
    <TeamsRoutePendingShell>
      <Suspense fallback={<TeamsCollaborationPageSkeleton />}>
        <CollaborationNetworkPageContent searchParams={searchParams} />
      </Suspense>
    </TeamsRoutePendingShell>
  )
}

async function CollaborationNetworkPageContent({
  searchParams,
}: CollaborationNetworkPageProps) {
  const raw = await searchParams
  const filters = parseCollaborationRouteFilters(raw)

  return (
    <TeamsRouteSection fallback={<TeamsCollaborationSkeleton />}>
      <CollaborationNetworkBlock filters={filters} />
    </TeamsRouteSection>
  )
}
