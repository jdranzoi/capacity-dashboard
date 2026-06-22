import { Suspense } from 'react'

import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-pending-shell'
import {
  UtilizationAnalyticsSkeleton,
  UtilizationKpiRowSkeleton,
  UtilizationPageSkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { UtilizationAnalyticsBlock } from '@/components/capacity/utilization/utilization-analytics-block'
import { UtilizationChromeBlock } from '@/components/capacity/utilization/utilization-chrome-block'
import { UtilizationKpiBlock } from '@/components/capacity/utilization/utilization-kpi-block'
import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { parseCapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

type CapacityUtilizationPageProps = {
  searchParams: Promise<{
    month?: string
    role?: string
    zone?: string
    project?: string
  }>
}

export default function CapacityUtilizationPage({ searchParams }: CapacityUtilizationPageProps) {
  return (
    <CapacityRoutePendingShell>
      <Suspense fallback={<UtilizationPageSkeleton />}>
        <CapacityUtilizationPageContent searchParams={searchParams} />
      </Suspense>
    </CapacityRoutePendingShell>
  )
}

async function CapacityUtilizationPageContent({ searchParams }: CapacityUtilizationPageProps) {
  const raw = await searchParams
  const routeFilters = parseCapacityRouteFilters(raw)
  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  return (
    <div className="flex flex-col gap-6">
      <CapacityRouteSection
        fallback={<DashboardSectionHeaderSkeleton filterCount={4} />}
      >
        <UtilizationChromeBlock
          monthStr={monthStr}
          routeFilters={routeFilters}
        />
      </CapacityRouteSection>

      <Suspense fallback={<UtilizationKpiRowSkeleton />}>
        <CapacityRouteSection fallback={<UtilizationKpiRowSkeleton />}>
          <UtilizationKpiBlock
            monthStr={monthStr}
            routeFilters={routeFilters}
          />
        </CapacityRouteSection>
      </Suspense>

      <Suspense fallback={<UtilizationAnalyticsSkeleton />}>
        <CapacityRouteSection fallback={<UtilizationAnalyticsSkeleton />}>
          <UtilizationAnalyticsBlock
            monthStr={monthStr}
            routeFilters={routeFilters}
          />
        </CapacityRouteSection>
      </Suspense>
    </div>
  );
}
