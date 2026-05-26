import { Suspense } from 'react'

import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-section'
import {
  CapacityPlanningChromeSkeleton,
  CapacityPlanningGridSkeleton,
  CapacityPlanningPageSkeleton,
  CapacityPlanningUpcomingSkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { CapacityPlanningAvailablePeopleLoading } from '@/components/capacity/planning/capacity-planning-available-people-loading'
import { CapacityPlanningAvailablePeopleBlock } from '@/components/capacity/planning/capacity-planning-available-people-block'
import { CapacityPlanningChromeBlock } from '@/components/capacity/planning/capacity-planning-chrome-block'
import { CapacityPlanningGridBlock } from '@/components/capacity/planning/capacity-planning-grid-block'
import { CapacityPlanningUpcomingBlock } from '@/components/capacity/planning/capacity-planning-upcoming-block'
import { CapacityPlanningViewTabs } from '@/components/capacity/planning/capacity-planning-view-tabs'
import { parsePlanningView } from '@/lib/capacity/planning/planning-route-period'

type CapacityPlanningPageProps = {
  searchParams: Promise<{
    from?: string
    to?: string
    view?: string
    peopleMonth?: string
    minAvail?: string
    peopleRole?: string
  }>
}

export default function CapacityPlanningPage({ searchParams }: CapacityPlanningPageProps) {
  return (
    <CapacityRoutePendingShell>
      <Suspense fallback={<CapacityPlanningPageSkeleton />}>
        <CapacityPlanningPageContent searchParams={searchParams} />
      </Suspense>
    </CapacityRoutePendingShell>
  )
}

async function CapacityPlanningPageContent({ searchParams }: CapacityPlanningPageProps) {
  const raw = await searchParams
  const view = parsePlanningView(raw.view)

  return (
    <div className="flex flex-col gap-8">
      <CapacityRouteSection fallback={<CapacityPlanningChromeSkeleton />}>
        <Suspense fallback={<CapacityPlanningChromeSkeleton />}>
          <CapacityPlanningChromeBlock fromParam={raw.from} toParam={raw.to} />
        </Suspense>
      </CapacityRouteSection>

      <CapacityPlanningViewTabs activeView={view} />

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        <section className="space-y-3 xl:col-span-9">
          <CapacityRouteSection fallback={<CapacityPlanningGridSkeleton />}>
            <Suspense fallback={<CapacityPlanningGridSkeleton />}>
              <CapacityPlanningGridBlock
                fromParam={raw.from}
                toParam={raw.to}
                viewParam={raw.view}
              />
            </Suspense>
          </CapacityRouteSection>
        </section>

        <aside className="flex flex-col gap-4 xl:col-span-3">
          <Suspense fallback={<CapacityPlanningAvailablePeopleLoading />}>
            <CapacityPlanningAvailablePeopleBlock
              fromParam={raw.from}
              toParam={raw.to}
              peopleMonthParam={raw.peopleMonth}
              minAvailParam={raw.minAvail}
              peopleRoleParam={raw.peopleRole}
            />
          </Suspense>
          <Suspense fallback={<CapacityPlanningUpcomingSkeleton />}>
            <CapacityPlanningUpcomingBlock fromParam={raw.from} toParam={raw.to} />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}
