import { TeamPageShell } from '@/components/team/team-page-shell'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
} from '@/lib/overview/overview-month-options'
import { loadTeamFilterOptions } from '@/lib/team/load-team-filter-options'
import { loadTeamMonthKpis } from '@/lib/team/load-team-month-kpis'
import { parseTeamRouteFilters } from '@/lib/team/team-route-filters'

export async function TeamPageData({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const routeFilters = parseTeamRouteFilters(raw)

  const monthParam = raw.month
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam

  const { options, error } = await loadOverviewMonthOptions()
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load month options: {error}
      </div>
    )
  }

  const selected = resolveSelectedOverviewMonth(options, monthStr)
  if (!selected) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        No historical months in <code className="font-mono text-xs">fact_capacity</code> yet. Run a
        sync, then refresh.
      </div>
    )
  }

  const { data: filterOptions, error: filterOptionsError } = await loadTeamFilterOptions(
    selected.snapshotId,
    selected.monthStartStr
  )
  if (filterOptionsError || !filterOptions) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {filterOptionsError ?? 'Could not load team filters.'}
      </div>
    )
  }

  const { data: kpis, error: kpisError } = await loadTeamMonthKpis(
    selected.monthStartStr,
    {
      id: selected.snapshotId,
      createdAt: selected.syncCreatedAt,
    },
    routeFilters
  )

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
      filterOptions={filterOptions}
      routeFilters={routeFilters}
      kpis={kpis}
    />
  )
}
