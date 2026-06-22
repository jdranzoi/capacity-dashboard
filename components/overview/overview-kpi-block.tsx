import { connection } from 'next/server'

import { OverviewKpiCards } from '@/components/overview/overview-headline-parts'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { perfSpan } from '@/lib/dev/perf-log'
import { getOverviewMonthSelection, getOverviewWeeklyData } from '@/lib/overview/overview-page-cache'

export async function OverviewKpiBlock({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return perfSpan('overview/kpis', async () => {
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
    return <p className="text-sm text-muted-foreground">No weeks in this month range.</p>
  }

  return <OverviewKpiCards weeks={data.weeks} />
  })
}
