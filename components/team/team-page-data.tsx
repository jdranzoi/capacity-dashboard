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

  const supabase = createServiceClientCached()
  const referenceDate = parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
  const { personIds, error: personFilterError } = await resolveFilteredPersonIds(
    supabase,
    selected.snapshotId,
    selected.monthStartStr,
    monthEndStr,
    routeFilters
  )
  if (personFilterError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {personFilterError}
      </div>
    )
  }

  const { data: kpis, error: kpisError } = await loadTeamMonthKpis(
    selected.monthStartStr,
    {
      id: selected.snapshotId,
      createdAt: selected.syncCreatedAt,
    },
    routeFilters,
    personIds
  )

  if (kpisError || !kpis) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {kpisError ?? 'Could not load team KPIs.'}
      </div>
    )
  }

  const { data: roleAnalytics, error: analyticsError } = await loadTeamRoleAnalytics(supabase, {
    monthStartStr: selected.monthStartStr,
    snapshot: { id: selected.snapshotId, createdAt: selected.syncCreatedAt },
    personIdFilter: personIds,
  })
  if (analyticsError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load role analytics: {analyticsError}
      </div>
    )
  }

  const { data: staffingRows, error: staffingError } = await loadTeamStaffingRows(supabase, {
    monthStartStr: selected.monthStartStr,
    snapshot: { id: selected.snapshotId, createdAt: selected.syncCreatedAt },
    personIdFilter: personIds,
  })
  if (staffingError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Could not load staffing grid: {staffingError}
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
      roleAnalyticsRows={roleAnalytics ?? []}
      staffingRows={staffingRows ?? []}
    />
  )
}
