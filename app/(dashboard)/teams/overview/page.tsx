import { Suspense } from 'react'

import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-section'
import {
  TeamsDistributionSkeleton,
  TeamsFutureCardsSkeleton,
  TeamsKpiRowSkeleton,
  TeamsPageSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { TeamsOverviewBlock } from '@/components/teams/overview/teams-overview-block'
import { TeamsOverviewChromeBlock } from '@/components/teams/overview/teams-overview-chrome-block'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'

type TeamsOverviewPageProps = {
  searchParams: Promise<{
    month?: string
  }>
}

export default function TeamsOverviewPage({ searchParams }: TeamsOverviewPageProps) {
  return (
    <TeamsRoutePendingShell>
      <Suspense fallback={<TeamsPageSkeleton />}>
        <TeamsOverviewPageContent searchParams={searchParams} />
      </Suspense>
    </TeamsRoutePendingShell>
  )
}

async function TeamsOverviewPageContent({ searchParams }: TeamsOverviewPageProps) {
  const raw = await searchParams
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  return (
    <div className="flex flex-col gap-8">
      <TeamsRouteSection fallback={<DashboardSectionHeaderSkeleton />}>
        <TeamsOverviewChromeBlock monthStr={monthStr} />
      </TeamsRouteSection>

      <Suspense
        fallback={
          <div className="flex flex-col gap-8">
            <TeamsKpiRowSkeleton />
            <TeamsDistributionSkeleton />
            <TeamsFutureCardsSkeleton />
          </div>
        }
      >
        <TeamsRouteSection
          fallback={
            <div className="flex flex-col gap-8">
              <TeamsKpiRowSkeleton />
              <TeamsDistributionSkeleton />
              <TeamsFutureCardsSkeleton />
            </div>
          }
        >
          <TeamsOverviewBlock monthStr={monthStr} />
        </TeamsRouteSection>
      </Suspense>
    </div>
  )
}
