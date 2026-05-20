import { Suspense } from 'react'

import { TeamAnalyticsBlock } from '@/components/team/team-analytics-block'
import { TeamHeaderBlock } from '@/components/team/team-header-block'
import { TeamKpiBlock } from '@/components/team/team-kpi-block'
import { TeamRoutePendingShell } from '@/components/team/team-route-pending-shell'
import { TeamRouteSection } from '@/components/team/team-route-section'
import {
  TeamAnalyticsSkeleton,
  TeamKpiRowSkeleton,
  TeamToolbarSkeleton,
} from '@/components/team/team-section-skeletons'
import { TeamToolbarBlock } from '@/components/team/team-toolbar-block'
import { parseTeamRouteFilters } from '@/lib/team/team-route-filters'

type TeamPageProps = {
  searchParams: Promise<{
    month?: string
    role?: string
    zone?: string
    project?: string
  }>
}

function teamHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
    </header>
  )
}

export default function TeamPage({ searchParams }: TeamPageProps) {
  return (
    <TeamRoutePendingShell>
      <Suspense fallback={teamHeaderSkeleton()}>
        <TeamPageContent searchParams={searchParams} />
      </Suspense>
    </TeamRoutePendingShell>
  )
}

async function TeamPageContent({ searchParams }: TeamPageProps) {
  const raw = await searchParams
  const routeFilters = parseTeamRouteFilters(raw)
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  return (
    <div className="flex flex-col gap-8">
      <TeamRouteSection fallback={teamHeaderSkeleton()}>
        <TeamHeaderBlock monthStr={monthStr} />
      </TeamRouteSection>

      <Suspense fallback={<TeamToolbarSkeleton />}>
        <TeamRouteSection fallback={<TeamToolbarSkeleton />}>
          <TeamToolbarBlock monthStr={monthStr} routeFilters={routeFilters} />
        </TeamRouteSection>
      </Suspense>

      <Suspense fallback={<TeamKpiRowSkeleton />}>
        <TeamRouteSection fallback={<TeamKpiRowSkeleton />}>
          <TeamKpiBlock monthStr={monthStr} routeFilters={routeFilters} />
        </TeamRouteSection>
      </Suspense>

      <Suspense fallback={<TeamAnalyticsSkeleton />}>
        <TeamRouteSection fallback={<TeamAnalyticsSkeleton />}>
          <TeamAnalyticsBlock monthStr={monthStr} routeFilters={routeFilters} />
        </TeamRouteSection>
      </Suspense>
    </div>
  )
}
