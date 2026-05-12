import { Suspense } from 'react'

import { TeamPageData } from '@/components/team/team-page-data'
import { TeamPageSkeleton } from '@/components/team/team-page-skeleton'
import { TeamRoutePendingShell } from '@/components/team/team-route-pending-shell'

export default function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return (
    <TeamRoutePendingShell>
      <Suspense fallback={<TeamPageSkeleton />}>
        <TeamPageData searchParams={searchParams} />
      </Suspense>
    </TeamRoutePendingShell>
  )
}
