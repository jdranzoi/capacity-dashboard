import { Suspense } from 'react'

import { TeamsHeaderBlock } from '@/components/teams/_shared/teams-header-block'
import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-section'
import {
  TeamsDistributionSkeleton,
  TeamsFutureCardsSkeleton,
  TeamsKpiRowSkeleton,
  TeamsPageSkeleton,
  TeamsToolbarSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { TeamsToolbarBlock } from '@/components/teams/_shared/teams-toolbar-block'
import { TeamsOverviewBlock } from '@/components/teams/overview/teams-overview-block'
import { getTeamsMonthSelection } from '@/lib/teams/shared/teams-page-cache'

type TeamsOverviewPageProps = {
  searchParams: Promise<{
    month?: string
  }>
}

function teamsHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
    </header>
  )
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

  const { selected } = await getTeamsMonthSelection(monthStr)

  return (
    <div className="flex flex-col gap-8">
      <TeamsRouteSection fallback={teamsHeaderSkeleton()}>
        <TeamsHeaderBlock
          title="Teams overview"
          subtitle="Organizational structure for the planning roster"
          referenceMonthLabel={selected?.label}
        />
      </TeamsRouteSection>

      <Suspense fallback={<TeamsToolbarSkeleton />}>
        <TeamsRouteSection fallback={<TeamsToolbarSkeleton />}>
          <TeamsToolbarBlock monthStr={monthStr} />
        </TeamsRouteSection>
      </Suspense>

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
