import { connection } from 'next/server'

import {
  OverviewPageTitle,
  OverviewSubtitle,
  OverviewToolbarPanel,
  overviewRangeLabel,
} from '@/components/overview/overview-headline-parts'
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
    <header className="flex flex-col gap-3 border-b border-border/80 pb-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <OverviewPageTitle />
          <OverviewSubtitle monthLabel={data.monthLabel} snapshotId={data.snapshotId} />
        </div>
      </div>
      <OverviewToolbarPanel
        rangeLabel={rangeLabel}
        monthPicker={{ options, selectedMonthKey: selected.monthKey }}
      />
    </header>
  )
  })
}
