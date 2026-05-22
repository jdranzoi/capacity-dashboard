import { Suspense } from 'react'

import { CapacityHeaderBlock } from '@/components/capacity/_shared/capacity-header-block'
import { CapacityRoutePendingShell } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-section'
import {
  CapacityChartsSkeleton,
  CapacityKpiRowSkeleton,
  CapacityPageSkeleton,
  CapacityRoleSummarySkeleton,
  CapacityToolbarSkeleton,
} from '@/components/capacity/_shared/capacity-section-skeletons'
import { CapacityToolbarBlock } from '@/components/capacity/_shared/capacity-toolbar-block'
import { CapacityOverviewBlock } from '@/components/capacity/overview/capacity-overview-block'
import { getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'
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

function capacityHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
    </header>
  )
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

  const { selected } = await getCapacityMonthSelection(monthStr)

  return (
    <div className="flex flex-col gap-8">
      <CapacityRouteSection fallback={capacityHeaderSkeleton()}>
        <CapacityHeaderBlock
          title="Capacity overview"
          subtitle="Org capacity position and monthly trends"
          referenceMonthLabel={selected?.label}
        />
      </CapacityRouteSection>

      <Suspense fallback={<CapacityToolbarSkeleton />}>
        <CapacityRouteSection fallback={<CapacityToolbarSkeleton />}>
          <CapacityToolbarBlock monthStr={monthStr} />
        </CapacityRouteSection>
      </Suspense>

      <Suspense
        fallback={
          <div className="flex flex-col gap-8">
            <CapacityKpiRowSkeleton />
            <CapacityChartsSkeleton />
            <CapacityRoleSummarySkeleton />
          </div>
        }
      >
        <CapacityRouteSection
          fallback={
            <div className="flex flex-col gap-8">
              <CapacityKpiRowSkeleton />
              <CapacityChartsSkeleton />
              <CapacityRoleSummarySkeleton />
            </div>
          }
        >
          <CapacityOverviewBlock monthStr={monthStr} routeFilters={routeFilters} />
        </CapacityRouteSection>
      </Suspense>
    </div>
  )
}
