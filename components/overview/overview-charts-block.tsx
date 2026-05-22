import { connection } from 'next/server'

import { OverviewChartsRow } from '@/components/overview/overview-headline-parts'
import {
  OverviewDataError,
  OverviewEmptyMonths,
} from '@/components/overview/overview-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getOverviewMonthSelection, getOverviewWeeklyData } from '@/lib/overview/overview-page-cache'

export async function OverviewChartsBlock({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return perfSpan('overview/charts', async () => {
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
    <OverviewChartsRow weeks={data.weeks} utilizationPct={data.utilizationPct} />
  )
  })
}
