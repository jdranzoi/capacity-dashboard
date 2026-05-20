import { connection } from 'next/server'

import { OverviewWeeklyDetailPanel } from '@/components/overview/overview-headline-parts'
import {
  OverviewDataError,
  OverviewEmptyMonths,
} from '@/components/overview/overview-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getOverviewMonthSelection, getOverviewWeeklyData } from '@/lib/overview/overview-page-cache'

export async function OverviewWeeklyDetailBlock({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return perfSpan('overview/weekly-detail', async () => {
  await connection()
  const { month: monthParam } = await searchParams
  const { selected, error } = await getOverviewMonthSelection(monthParam)
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
  if (data.weeks.length === 0) {
    return null
  }

  return (
    <OverviewWeeklyDetailPanel
      weeks={data.weeks}
      asOfDate={data.asOfDate}
      syncCreatedAt={data.syncCreatedAt}
    />
  )
  })
}
