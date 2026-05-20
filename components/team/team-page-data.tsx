import { TeamPageShell } from '@/components/team/team-page-shell'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadTeamFilterOptions } from '@/lib/team/load-team-filter-options'
import { loadTeamMonthKpis } from '@/lib/team/load-team-month-kpis'
import { loadTeamRoleAnalytics } from '@/lib/team/load-team-role-analytics'
import { loadTeamStaffingRows } from '@/lib/team/load-team-staffing-rows'
import { resolveFilteredPersonIds } from '@/lib/team/resolve-filtered-person-ids'
import { parseTeamRouteFilters } from '@/lib/team/team-route-filters'
import { connection } from 'next/server'
import { endOfMonth, format, parse } from 'date-fns'

export async function TeamPageData({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await connection()
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

  const supabase = createServiceClientCached()
  const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
  const snapshot = { id: selected.snapshotId, createdAt: selected.syncCreatedAt }

  const [filterOptionsResult, personIdsResult] = await Promise.all([
    loadTeamFilterOptions(selected.snapshotId, selected.monthStartStr),
    resolveFilteredPersonIds(
      supabase,
      selected.snapshotId,
      selected.monthStartStr,
      monthEndStr,
      routeFilters
    ),
  ])

  if (filterOptionsResult.error || !filterOptionsResult.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {filterOptionsResult.error ?? 'Could not load team filters.'}
      </div>
    )
  }

  if (personIdsResult.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {personIdsResult.error}
      </div>
    )
  }

  const personIds = personIdsResult.personIds

  const [kpisResult, roleResult, staffingResult] = await Promise.all([
    loadTeamMonthKpis(selected.monthStartStr, snapshot, routeFilters, personIds),
    loadTeamRoleAnalytics(supabase, {
      monthStartStr: selected.monthStartStr,
      snapshot,
      personIdFilter: personIds,
    }),
    loadTeamStaffingRows(supabase, {
      monthStartStr: selected.monthStartStr,
      snapshot,
      personIdFilter: personIds,
    }),
  ])

  if (kpisResult.error || !kpisResult.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {kpisResult.error ?? 'Could not load team KPIs.'}
      </div>
    )
  }

  if (roleResult.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load role analytics: {roleResult.error}
      </div>
    )
  }

  if (staffingResult.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load staffing grid: {staffingResult.error}
      </div>
    )
  }

  return (
    <TeamPageShell
      referenceMonthLabel={selected.label}
      monthPicker={{ options, selectedMonthKey: selected.monthKey }}
      filterOptions={filterOptionsResult.data}
      routeFilters={routeFilters}
      kpis={kpisResult.data}
      roleAnalyticsRows={roleResult.data ?? []}
      staffingRows={staffingResult.data ?? []}
    />
  )
}
