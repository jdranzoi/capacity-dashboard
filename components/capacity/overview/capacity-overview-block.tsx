import { connection } from 'next/server'

import { CapacityOverviewTrendsSection } from '@/components/capacity/overview/capacity-overview-charts-section'
import { CapacityOverviewKpiSection } from '@/components/capacity/overview/capacity-overview-kpi-section'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadCapacityOverview } from '@/lib/capacity/overview/load-capacity-overview'
import { getCapacityMonthContext } from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'
import { parse } from 'date-fns'

export async function CapacityOverviewBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/overview', async () => {
    await connection()
    const ctx = await getCapacityMonthContext(monthStr, routeFilters)
    if (ctx.error) {
      return <SectionDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <SectionEmptyState />
    }

    const { selected, snapshot, personIds } = ctx.data
    const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())

    const result = await loadCapacityOverview({
      monthStartStr: selected.monthStartStr,
      snapshot,
      personIdFilter: personIds,
      referenceDate,
    })

    if (result.error || !result.data) {
      return (
        <SectionDataError message={result.error ?? 'Could not load capacity overview.'} />
      )
    }

    const data = result.data

    return (
      <div className="flex flex-col gap-6">
        <CapacityOverviewKpiSection data={data} />
        <CapacityOverviewTrendsSection data={data} />
      </div>
    );
  })
}
