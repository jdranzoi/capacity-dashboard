import { connection } from 'next/server'
import { parse } from 'date-fns'

import { CapacityOverviewTrendsSection } from '@/components/capacity/overview/capacity-overview-charts-section'
import { CapacityOverviewMonthStrip } from '@/components/capacity/overview/capacity-overview-month-strip'
import { CapacityYearSection } from '@/components/capacity/overview/capacity-year-section'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { loadCapacityOverview } from '@/lib/capacity/overview/load-capacity-overview'
import { loadCapacityYear } from '@/lib/capacity/overview/load-capacity-year'
import { getCapacityMonthContext } from '@/lib/capacity/shared/capacity-page-cache'
import { emptyCapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'
import { perfSpan } from '@/lib/dev/perf-log'

export async function CapacityOverviewBlock() {
  return perfSpan('capacity/overview', async () => {
    await connection()
    const [ctx, yearResult] = await Promise.all([
      getCapacityMonthContext(undefined, emptyCapacityRouteFilters()),
      loadCapacityYear(),
    ])

    if (ctx.error) {
      return <SectionDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <SectionEmptyState />
    }
    if (yearResult.error) {
      return <SectionDataError message={yearResult.error} />
    }

    const { selected, snapshot } = ctx.data
    const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
    const monthResult = await loadCapacityOverview({
      monthStartStr: selected.monthStartStr,
      snapshot,
      personIdFilter: null,
      referenceDate,
    })

    if (monthResult.error || !monthResult.data) {
      return (
        <SectionDataError message={monthResult.error ?? 'Could not load capacity overview.'} />
      )
    }

    return (
      <div className="flex flex-col gap-6">
        <CapacityOverviewMonthStrip data={monthResult.data} />
        {yearResult.data ? (
          <CapacityYearSection data={yearResult.data} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Year comparison is empty. Apply migration 026 and run rebuild-month-ops.
          </p>
        )}
        <CapacityOverviewTrendsSection data={monthResult.data} />
      </div>
    )
  })
}
