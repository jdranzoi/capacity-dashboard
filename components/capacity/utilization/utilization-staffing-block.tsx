import { connection } from 'next/server'

import { UtilizationStaffingGrid } from '@/components/capacity/utilization/utilization-staffing-grid'
import { CapacityDataError } from '@/components/capacity/_shared/capacity-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import {
  getUtilizationMonthKpisCached,
  getUtilizationStaffingRowsCached,
  getCapacityMonthSelection,
} from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export async function UtilizationStaffingBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/utilization/staffing', async () => {
  await connection()
  const { selected, error: monthErr } = await getCapacityMonthSelection(monthStr)
  if (monthErr || !selected) {
    return null
  }

  const [staffingResult, kpisResult] = await Promise.all([
    getUtilizationStaffingRowsCached(monthStr, routeFilters),
    getUtilizationMonthKpisCached(monthStr, routeFilters),
  ])

  if (staffingResult.error) {
    return <CapacityDataError message={`Could not load staffing grid: ${staffingResult.error}`} />
  }

  const asOfDate = kpisResult.data?.asOfDate ?? null

  return (
    <UtilizationStaffingGrid
      rows={staffingResult.data ?? []}
      embedded
      footnote={
        asOfDate
          ? `Non-PTO logged and billable through ${asOfDate}; PTO through calendar month end (overview-aligned).`
          : null
      }
    />
  )
  })
}
