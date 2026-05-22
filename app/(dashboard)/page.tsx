import { Suspense } from 'react'

import { OverviewChartsBlock } from '@/components/overview/overview-charts-block'
import { OverviewKpiBlock } from '@/components/overview/overview-kpi-block'
import { OverviewRoutePendingShell } from '@/components/overview/overview-route-pending-shell'
import { OverviewRouteSection } from '@/components/overview/overview-route-section'
import {
  OverviewChartsRowSkeleton,
  OverviewKpiRowSkeleton,
  OverviewToolbarSkeleton,
} from '@/components/overview/overview-section-skeletons'
import { OverviewToolbarBlock } from '@/components/overview/overview-toolbar-block'

type OverviewPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default function OverviewPage({ searchParams }: OverviewPageProps) {
  return (
    <OverviewRoutePendingShell>
      <section className="flex flex-col gap-6">
        <Suspense fallback={<OverviewToolbarSkeleton />}>
          <OverviewRouteSection fallback={<OverviewToolbarSkeleton />}>
            <OverviewToolbarBlock searchParams={searchParams} />
          </OverviewRouteSection>
        </Suspense>

        <Suspense fallback={<OverviewKpiRowSkeleton />}>
          <OverviewRouteSection fallback={<OverviewKpiRowSkeleton />}>
            <OverviewKpiBlock searchParams={searchParams} />
          </OverviewRouteSection>
        </Suspense>

        <Suspense fallback={<OverviewChartsRowSkeleton />}>
          <OverviewRouteSection fallback={<OverviewChartsRowSkeleton />}>
            <OverviewChartsBlock searchParams={searchParams} />
          </OverviewRouteSection>
        </Suspense>

      </section>
    </OverviewRoutePendingShell>
  )
}
