import { Suspense } from 'react'

import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-pending-shell'
import {
  CapacityChartsSkeleton,
  CapacityOpsKpiSkeleton,
  CapacityPageSkeleton,
  CapacityRoleSummarySkeleton,
  CapacityYearGridSkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { CapacityOverviewBlock } from '@/components/capacity/overview/capacity-overview-block'
import { CapacityOverviewChromeBlock } from '@/components/capacity/overview/capacity-overview-chrome-block'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'

export default function CapacityOverviewPage() {
  return (
    <CapacityRoutePendingShell>
      <Suspense fallback={<CapacityPageSkeleton />}>
        <CapacityOverviewPageContent />
      </Suspense>
    </CapacityRoutePendingShell>
  )
}

async function CapacityOverviewPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <CapacityRouteSection fallback={<DashboardSectionHeaderSkeleton />}>
        <CapacityOverviewChromeBlock />
      </CapacityRouteSection>

      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <CapacityOpsKpiSkeleton />
            <CapacityYearGridSkeleton />
            <CapacityChartsSkeleton />
            <CapacityRoleSummarySkeleton />
          </div>
        }
      >
        <CapacityRouteSection
          fallback={
            <div className="flex flex-col gap-6">
              <CapacityOpsKpiSkeleton />
              <CapacityYearGridSkeleton />
              <CapacityChartsSkeleton />
              <CapacityRoleSummarySkeleton />
            </div>
          }
        >
          <CapacityOverviewBlock />
        </CapacityRouteSection>
      </Suspense>
    </div>
  )
}
