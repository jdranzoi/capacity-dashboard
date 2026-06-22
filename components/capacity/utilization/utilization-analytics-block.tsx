import { connection } from 'next/server'
import { Suspense } from 'react'

import { UtilizationAnalyticsGrid } from '@/components/capacity/utilization/utilization-analytics-grid'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { CapacityRouteSection } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { UtilizationStaffingBlock } from '@/components/capacity/utilization/utilization-staffing-block'
import { UtilizationStaffingSkeleton } from '@/components/capacity/_shared/capacity-section-skeletons'
import { perfSpan } from '@/lib/dev/perf-log'
import { getUtilizationRoleAnalyticsCached, getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export async function UtilizationAnalyticsBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/utilization/analytics', async () => {
  await connection()
  const { selected, error: monthErr } = await getCapacityMonthSelection(monthStr)
  if (monthErr) {
    return <SectionDataError message={`Could not load month options: ${monthErr}`} />
  }
  if (!selected) {
    return <SectionEmptyState />
  }

  const { data: rows, error } = await getUtilizationRoleAnalyticsCached(monthStr, routeFilters)

  if (error) {
    return <SectionDataError message={`Could not load role analytics: ${error}`} />
  }

  return (
    <section data-slot="team-analytics-grid" aria-labelledby="team-analytics-heading">
      <h2
        id="team-analytics-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Analytics
      </h2>
      <UtilizationAnalyticsGrid
        rows={rows ?? []}
        staffingSlot={
          <Suspense fallback={<UtilizationStaffingSkeleton />}>
            <CapacityRouteSection fallback={<UtilizationStaffingSkeleton />}>
              <UtilizationStaffingBlock monthStr={monthStr} routeFilters={routeFilters} />
            </CapacityRouteSection>
          </Suspense>
        }
      />
    </section>
  )
  })
}
