import { connection } from 'next/server'

import { CapacityDataError, CapacityEmptyMonths } from '@/components/capacity/_shared/capacity-data-error'
import { UtilizationToolbar } from '@/components/capacity/utilization/utilization-toolbar'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { getCapacityMonthContext } from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export async function UtilizationChromeBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/utilization/chrome', async () => {
    await connection()
    const boot = await getCapacityMonthContext(monthStr, routeFilters)

    if (boot.error) {
      return <CapacityDataError message={boot.error} />
    }
    if (!boot.data) {
      return <CapacityEmptyMonths />
    }

    const { options, selected, filterOptions } = boot.data

    return (
      <DashboardSectionHeader
        title="Utilization"
        subtitle="Role and person operational usage"
        filters={
          <UtilizationToolbar
            monthPicker={{ options, selectedMonthKey: selected.monthKey }}
            filterOptions={filterOptions}
            routeFilters={routeFilters}
          />
        }
      />
    )
  })
}
