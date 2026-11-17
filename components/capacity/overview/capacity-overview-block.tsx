import { connection } from 'next/server'
import { format, parse } from 'date-fns'

import { CapacityOverviewMonthToDateSection } from '@/components/capacity/overview/capacity-overview-charts-section'
import { CapacityYearGridSection } from '@/components/capacity/overview/capacity-year-grid'
import { CapacityYearSection } from '@/components/capacity/overview/capacity-year-section'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { loadCapacityOverview } from '@/lib/capacity/overview/load-capacity-overview'
import { loadCapacityYear } from '@/lib/capacity/overview/load-capacity-year'
import { getCapacityMonthContext } from '@/lib/capacity/shared/capacity-page-cache'
import { loadPlanningMonthOptions } from '@/lib/capacity/shared/load-planning-month-options'
import { loadOverviewMonthOptions } from '@/lib/overview/overview-month-options'
import { TEAMS_MONTH_HORIZON } from '@/lib/teams/shared/teams-month-horizon'
import { emptyCapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'
import { perfSpan } from '@/lib/dev/perf-log'

export async function CapacityOverviewBlock() {
  return perfSpan('capacity/overview', async () => {
    await connection()
    const [ctx, yearResult, teamsMonths, planningMonths] = await Promise.all([
      getCapacityMonthContext(undefined, emptyCapacityRouteFilters()),
      loadCapacityYear(),
      loadOverviewMonthOptions(TEAMS_MONTH_HORIZON),
      loadPlanningMonthOptions(),
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

    const monthToDate = (
      <CapacityOverviewMonthToDateSection
        data={monthResult.data}
        monthLabel={format(referenceDate, 'MMMM yyyy')}
      />
    )

    if (!yearResult.data) {
      return (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            Year comparison is empty. Apply migration 026 and run rebuild-month-ops.
          </p>
          {monthToDate}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        <CapacityYearGridSection
          grids={yearResult.data.grids}
          defaultYear={yearResult.data.currentYear}
          headcountLinkMonths={teamsMonths.options.map((option) => option.monthKey)}
          plannedLinkMonths={planningMonths.options.map((option) => option.monthKey)}
          utilizationLinkMonths={ctx.data.options.map((option) => option.monthKey)}
        />
        {monthToDate}
        <CapacityYearSection data={yearResult.data} />
      </div>
    )
  })
}
