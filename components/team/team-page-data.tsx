import { TeamPageShell } from '@/components/team/team-page-shell'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
} from '@/lib/overview/overview-month-options'
import { loadTeamMonthKpis } from '@/lib/team/load-team-month-kpis'

export async function TeamPageData({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams

  const { options, error } = await loadOverviewMonthOptions()
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load month options: {error}
      </div>
    )
  }

  const selected = resolveSelectedOverviewMonth(options, monthParam)
  if (!selected) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        No historical months in <code className="font-mono text-xs">fact_capacity</code> yet. Run a
        sync, then refresh.
      </div>
    )
  }

  const { data: kpis, error: kpisError } = await loadTeamMonthKpis(selected.monthStartStr, {
    id: selected.snapshotId,
    createdAt: selected.syncCreatedAt,
  })

  if (kpisError || !kpis) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {kpisError ?? 'Could not load team KPIs.'}
      </div>
    )
  }

  return (
    <TeamPageShell
      referenceMonthLabel={selected.label}
      monthPicker={{ options, selectedMonthKey: selected.monthKey }}
      kpis={kpis}
    />
  )
}
