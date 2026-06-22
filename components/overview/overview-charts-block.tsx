import { connection } from 'next/server'

import { OverviewChartsAndDetailRow } from '@/components/overview/overview-headline-parts'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
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
    return <SectionDataError message={`Could not load month options: ${error}`} />
  }
  if (!selected) {
    return <SectionEmptyState />
  }

  const data = await getOverviewWeeklyData(
    selected.monthStartStr,
    selected.snapshotId,
    selected.syncCreatedAt
  )

  if (data.error) {
    return <SectionDataError message={data.error} />
  }
  if (data.weeks.length === 0) {
    return null
  }

  return (
    <OverviewChartsAndDetailRow weeks={data.weeks} asOfDate={data.asOfDate} />
  )
  })
}
