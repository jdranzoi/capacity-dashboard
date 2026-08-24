import { Suspense } from 'react'

import { TeamsCompositionBlock } from '@/components/teams/composition/teams-composition-block'
import { TeamsCompositionChromeBlock } from '@/components/teams/composition/teams-composition-chrome-block'
import { TeamsCompositionNavBlock } from '@/components/teams/composition/teams-composition-nav-block'
import { TeamsCompositionStickyNav } from '@/components/teams/composition/teams-composition-sticky-nav'
import { TeamsRoutePendingShell } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsRouteSection } from '@/components/teams/_shared/teams-route-pending-shell'
import {
  TeamsCompositionAnchorNavSkeleton,
  TeamsCompositionCardsSkeleton,
  TeamsPageSkeleton,
} from '@/components/teams/_shared/teams-section-skeletons'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { parseCompositionView } from '@/lib/teams/composition/teams-composition-utils'
import { parseTeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

type TeamsCompositionPageProps = {
  searchParams: Promise<{
    month?: string
    q?: string
    project?: string
    pm?: string
    view?: string
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
  const view = parseCompositionView(raw.view)
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<DashboardSectionHeaderSkeleton filterCount={4} />}>
        <TeamsCompositionChromeBlock
          monthStr={monthStr}
          routeFilters={routeFilters}
          view={view}
        />
      </Suspense>

      <div className="flex flex-col gap-3" data-slot="teams-composition-section">
        <TeamsCompositionStickyNav
          view={view}
          tabs={
            <Suspense fallback={<TeamsCompositionAnchorNavSkeleton />}>
              <TeamsRouteSection fallback={<TeamsCompositionAnchorNavSkeleton />}>
                <TeamsCompositionNavBlock
                  monthStr={monthStr}
                  routeFilters={routeFilters}
                  view={view}
                />
              </TeamsRouteSection>
            </Suspense>
          }
        />

        <Suspense fallback={<TeamsCompositionCardsSkeleton />}>
          <TeamsRouteSection fallback={<TeamsCompositionCardsSkeleton />}>
            <TeamsCompositionBlock
              monthStr={monthStr}
              routeFilters={routeFilters}
              view={view}
            />
          </TeamsRouteSection>
        </Suspense>
      </div>
    </div>
  )
}
