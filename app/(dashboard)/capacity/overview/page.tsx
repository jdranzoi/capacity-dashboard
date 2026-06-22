import { Suspense } from 'react'

import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-pending-shell'
import {
  CapacityChartsSkeleton,
  CapacityKpiRowSkeleton,
  CapacityPageSkeleton,
  CapacityRoleSummarySkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { CapacityOverviewBlock } from '@/components/capacity/overview/capacity-overview-block'
import { CapacityOverviewChromeBlock } from '@/components/capacity/overview/capacity-overview-chrome-block'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { parseCapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

type CapacityOverviewPageProps = {
  searchParams: Promise<{
    month?: string
    role?: string
    zone?: string
    project?: string
    projectType?: string
  }>
}

export default function CapacityOverviewPage({ searchParams }: CapacityOverviewPageProps) {
  return (
    <CapacityRoutePendingShell>
      <Suspense fallback={<CapacityPageSkeleton />}>
        <CapacityOverviewPageContent searchParams={searchParams} />
      </Suspense>
    </CapacityRoutePendingShell>
  )
}

async function CapacityOverviewPageContent({ searchParams }: CapacityOverviewPageProps) {
  const raw = await searchParams
  const routeFilters = parseCapacityRouteFilters(raw)
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  return (
    <div className="flex flex-col gap-6">
      <CapacityRouteSection fallback={<DashboardSectionHeaderSkeleton />}>
        <CapacityOverviewChromeBlock monthStr={monthStr} />
      </CapacityRouteSection>

      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <CapacityKpiRowSkeleton />
            <CapacityChartsSkeleton />
            <CapacityRoleSummarySkeleton />
          </div>
        }
      >
        <CapacityRouteSection
          fallback={
            <div className="flex flex-col gap-6">
              <CapacityKpiRowSkeleton />
              <CapacityChartsSkeleton />
              <CapacityRoleSummarySkeleton />
            </div>
          }
        >
          <CapacityOverviewBlock
            monthStr={monthStr}
            routeFilters={routeFilters}
          />
        </CapacityRouteSection>
      </Suspense>
    </div>
  );
}
