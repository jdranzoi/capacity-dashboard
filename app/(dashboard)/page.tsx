import { Suspense } from 'react'
import { WeeklyHeadlineSection } from '@/components/overview/weekly-headline-section'
import { WeeklyHeadlineSkeleton } from '@/components/overview/weekly-headline-skeleton'
import { loadWeeklyOverview } from '@/lib/overview/load-weekly-overview'

async function WeeklyData() {
  const data = await loadWeeklyOverview()

  if (data.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {data.error}
      </div>
    )
  }

  return (
    <WeeklyHeadlineSection
      monthLabel={data.monthLabel}
      asOfDate={data.asOfDate}
      snapshotId={data.snapshotId}
      syncCreatedAt={data.syncCreatedAt}
      weeks={data.weeks}
    />
  )
}

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<WeeklyHeadlineSkeleton />}>
        <WeeklyData />
      </Suspense>
    </div>
  )
}
