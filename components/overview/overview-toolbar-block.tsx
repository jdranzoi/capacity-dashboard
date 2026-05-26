import { connection } from 'next/server'

import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { overviewRangeLabel } from '@/components/overview/overview-headline-parts'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import {
  OverviewDataError,
  OverviewEmptyMonths,
} from '@/components/overview/overview-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getOverviewMonthSelection, getOverviewWeeklyData } from '@/lib/overview/overview-page-cache'

export async function OverviewToolbarBlock({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return perfSpan('overview/toolbar', async () => {
  await connection()
  const { month: monthParam } = await searchParams
  const { options, selected, error } = await getOverviewMonthSelection(monthParam)

  if (error) {
    return <OverviewDataError message={`Could not load month options: ${error}`} />
  }
  if (!selected) {
    return <OverviewEmptyMonths />
  }

  const data = await getOverviewWeeklyData(
    selected.monthStartStr,
    selected.snapshotId,
    selected.syncCreatedAt
  )

  if (data.error) {
    return <OverviewDataError message={data.error} />
  }

  const rangeLabel =
    data.weeks.length > 0 ? overviewRangeLabel(data.weeks) : '—'

  return (
    <DashboardSectionHeader
      title="Workload performance"
      subtitle="Weekly workload metrics for the reference month."
      filters={
        <DashboardFilterField
          label="Period"
          hint={data.weeks.length > 0 ? `Weeks overlapping month: ${rangeLabel}` : undefined}
        >
          <OverviewMonthPicker options={options} selectedMonthKey={selected.monthKey} />
        </DashboardFilterField>
      }
    />
  )
  })
}
