import { Suspense } from 'react'

import { TeamsCompositionBlock } from '@/components/teams/composition/teams-composition-block'
import { TeamsCompositionToolbarBlock } from '@/components/teams/composition/teams-composition-toolbar-block'
import { TeamsHeaderBlock } from '@/components/teams/_shared/teams-header-block'
import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-section'
import {
  TeamsCompositionGridSkeleton,
  TeamsPageSkeleton,
  TeamsToolbarSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { getTeamsMonthSelection } from '@/lib/teams/shared/teams-page-cache'
import { parseTeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

type TeamsCompositionPageProps = {
  searchParams: Promise<{
    month?: string
    q?: string
    project?: string
  }>
}

function teamsHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
    </header>
  )
}

export default function TeamsCompositionPage({ searchParams }: TeamsCompositionPageProps) {
  return (
    <TeamsRoutePendingShell>
      <Suspense fallback={<TeamsPageSkeleton variant="composition" />}>
        <TeamsCompositionPageContent searchParams={searchParams} />
      </Suspense>
    </TeamsRoutePendingShell>
  )
}

async function TeamsCompositionPageContent({ searchParams }: TeamsCompositionPageProps) {
  const raw = await searchParams
  const routeFilters = parseTeamsRouteFilters(raw)
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  const { selected } = await getTeamsMonthSelection(monthStr)

  return (
    <div className="flex flex-col gap-8">
      <TeamsRouteSection fallback={teamsHeaderSkeleton()}>
        <TeamsHeaderBlock
          title="Teams composition"
          subtitle="Project teams grouped by delivery type"
          referenceMonthLabel={selected?.label}
        />
      </TeamsRouteSection>

      <Suspense fallback={<TeamsToolbarSkeleton showCompositionFilters />}>
        <TeamsRouteSection fallback={<TeamsToolbarSkeleton showCompositionFilters />}>
          <TeamsCompositionToolbarBlock monthStr={monthStr} routeFilters={routeFilters} />
        </TeamsRouteSection>
      </Suspense>

      <Suspense fallback={<TeamsCompositionGridSkeleton />}>
        <TeamsRouteSection fallback={<TeamsCompositionGridSkeleton />}>
          <TeamsCompositionBlock monthStr={monthStr} routeFilters={routeFilters} />
        </TeamsRouteSection>
      </Suspense>
    </div>
  )
}
