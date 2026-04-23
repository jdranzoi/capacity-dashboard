import { WeeklyHeadlineSection } from '@/components/overview/weekly-headline-section'
import { loadWeeklyOverview } from '@/lib/overview/load-weekly-overview'

export default async function OverviewPage() {
  const data = await loadWeeklyOverview()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Month-to-date workload from Tempo worklogs (single section while we validate the pipeline).
        </p>
      </div>

      {data.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      ) : (
        <WeeklyHeadlineSection
          monthLabel={data.monthLabel}
          asOfDate={data.asOfDate}
          weeks={data.weeks}
        />
      )}
    </div>
  )
}
