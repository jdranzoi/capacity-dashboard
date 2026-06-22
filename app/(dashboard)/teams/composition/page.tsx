import { Suspense } from 'react'

import { TeamsCompositionBlock } from '@/components/teams/composition/teams-composition-block'
import { TeamsCompositionChromeBlock } from '@/components/teams/composition/teams-composition-chrome-block'
import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-pending-shell'
import {
  TeamsCompositionGridSkeleton,
  TeamsPageSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { parseTeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

type TeamsCompositionPageProps = {
  searchParams: Promise<{
    month?: string
    q?: string
    project?: string
  }>
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

  return (
    <div className="flex flex-col gap-6">
      <TeamsRouteSection
        fallback={<DashboardSectionHeaderSkeleton filterCount={3} />}
      >
        <TeamsCompositionChromeBlock
          monthStr={monthStr}
          routeFilters={routeFilters}
        />
      </TeamsRouteSection>

      <Suspense fallback={<TeamsCompositionGridSkeleton />}>
        <TeamsRouteSection fallback={<TeamsCompositionGridSkeleton />}>
          <TeamsCompositionBlock
            monthStr={monthStr}
            routeFilters={routeFilters}
          />
        </TeamsRouteSection>
      </Suspense>
    </div>
  );
}
