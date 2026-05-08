import { parse, format, startOfMonth } from 'date-fns'
import { Suspense } from 'react'

import { OverviewRoutePendingShell } from '@/components/overview/overview-route-pending-shell'

import { WeeklyHeadlineSection } from '@/components/overview/weekly-headline-section'
import { WeeklyHeadlineSkeleton } from '@/components/overview/weekly-headline-skeleton'
import { loadWeeklyOverview } from '@/lib/overview/load-weekly-overview'
import {
  loadOverviewMonthOptions,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'

function resolveSelectedMonth(
  options: OverviewMonthOption[],
  monthParam: string | undefined
): OverviewMonthOption | null {
  if (options.length === 0) return null
  if (monthParam) {
    const hit = options.find((o) => o.monthKey === monthParam)
    if (hit) return hit
  }
  const currentKey = format(startOfMonth(new Date()), 'yyyy-MM')
  return options.find((o) => o.monthKey === currentKey) ?? options[0]
}

async function WeeklyData({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams

  const { options, error: monthsError } = await loadOverviewMonthOptions()
  if (monthsError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load month options: {monthsError}
      </div>
    )
  }

  const selected = resolveSelectedMonth(options, monthParam)
  if (!selected) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        No historical months in <code className="font-mono text-xs">fact_capacity</code> yet. Run a
        sync, then refresh.
      </div>
    )
  }

  const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
  const data = await loadWeeklyOverview(referenceDate, undefined, {
    id: selected.snapshotId,
    createdAt: selected.syncCreatedAt,
  })

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
      mtdUtilizationAvgPct={data.mtdUtilizationAvgPct}
      weeks={data.weeks}
      monthPicker={{
        options,
        selectedMonthKey: selected.monthKey,
      }}
    />
  )
}

export default function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return (
    <OverviewRoutePendingShell>
      <Suspense fallback={<WeeklyHeadlineSkeleton />}>
        <WeeklyData searchParams={searchParams} />
      </Suspense>
    </OverviewRoutePendingShell>
  )
}
