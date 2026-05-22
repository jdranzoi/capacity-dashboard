import { connection } from 'next/server'

import { UtilizationKpiSection } from '@/components/capacity/utilization/utilization-kpi-section'
import { CapacityDataError, CapacityEmptyMonths } from '@/components/capacity/_shared/capacity-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getUtilizationMonthKpisCached, getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export async function UtilizationKpiBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/utilization/kpis', async () => {
  await connection()
  const { selected, error: monthErr } = await getCapacityMonthSelection(monthStr)
  if (monthErr) {
    return <CapacityDataError message={`Could not load month options: ${monthErr}`} />
  }
  if (!selected) {
    return <CapacityEmptyMonths />
  }

  const { data: kpis, error } = await getUtilizationMonthKpisCached(monthStr, routeFilters)

  if (error || !kpis) {
    return <CapacityDataError message={error ?? 'Could not load utilization KPIs.'} />
  }

  return <UtilizationKpiSection kpis={kpis} />
  })
}
