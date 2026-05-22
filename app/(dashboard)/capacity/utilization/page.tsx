import { Suspense } from 'react'

import { CapacityHeaderBlock } from '@/components/capacity/_shared/capacity-header-block'
import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-section'
import {
  UtilizationAnalyticsSkeleton,
  UtilizationKpiRowSkeleton,
  UtilizationPageSkeleton,
  UtilizationToolbarSkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { UtilizationAnalyticsBlock } from '@/components/capacity/utilization/utilization-analytics-block'
import { UtilizationKpiBlock } from '@/components/capacity/utilization/utilization-kpi-block'
import { UtilizationToolbarBlock } from '@/components/capacity/utilization/utilization-toolbar-block'
import { getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'
import { parseCapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

type CapacityUtilizationPageProps = {
  searchParams: Promise<{
    month?: string
    role?: string
    zone?: string
    project?: string
  }>
}

function utilizationHeaderSkeleton() {
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
  const { selected } = await getCapacityMonthSelection(monthStr)

  return (
    <div className="flex flex-col gap-8">
      <CapacityRouteSection fallback={utilizationHeaderSkeleton()}>
        <CapacityHeaderBlock
          title="Utilization"
          subtitle="Role and person operational usage"
          referenceMonthLabel={selected?.label}
        />
      </CapacityRouteSection>

      <Suspense fallback={<UtilizationToolbarSkeleton />}>
        <CapacityRouteSection fallback={<UtilizationToolbarSkeleton />}>
          <UtilizationToolbarBlock monthStr={monthStr} routeFilters={routeFilters} />
        </CapacityRouteSection>
      </Suspense>

      <Suspense fallback={<UtilizationKpiRowSkeleton />}>
        <CapacityRouteSection fallback={<UtilizationKpiRowSkeleton />}>
          <UtilizationKpiBlock monthStr={monthStr} routeFilters={routeFilters} />
        </CapacityRouteSection>
      </Suspense>

      <Suspense fallback={<UtilizationAnalyticsSkeleton />}>
        <CapacityRouteSection fallback={<UtilizationAnalyticsSkeleton />}>
          <UtilizationAnalyticsBlock monthStr={monthStr} routeFilters={routeFilters} />
        </CapacityRouteSection>
      </Suspense>
    </div>
  )
}
