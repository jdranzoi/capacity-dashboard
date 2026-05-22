import { connection } from 'next/server'

import { TeamStaffingGrid } from '@/components/team/team-staffing-grid'
import { TeamDataError } from '@/components/team/team-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import {
  getTeamMonthKpisCached,
  getTeamStaffingRowsCached,
  getTeamMonthSelection,
} from '@/lib/team/team-page-cache'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export async function TeamStaffingBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamRouteFilters
}) {
  return perfSpan('team/staffing', async () => {
  await connection()
  const { selected, error: monthErr } = await getTeamMonthSelection(monthStr)
  if (monthErr || !selected) {
    return null
  }

  const [staffingResult, kpisResult] = await Promise.all([
    getTeamStaffingRowsCached(
      monthStr,
      routeFilters.roleKey,
      routeFilters.zoneKey,
      routeFilters.projectKey
    ),
    getTeamMonthKpisCached(
      monthStr,
      routeFilters.roleKey,
      routeFilters.zoneKey,
      routeFilters.projectKey
    ),
  ])

  if (staffingResult.error) {
    return <TeamDataError message={`Could not load staffing grid: ${staffingResult.error}`} />
  }

  const asOfDate = kpisResult.data?.asOfDate ?? null

  return (
    <TeamStaffingGrid
      rows={staffingResult.data ?? []}
      embedded
      footnote={
        asOfDate
          ? `Non-PTO logged and billable through ${asOfDate}; PTO through calendar month end (overview-aligned).`
          : null
      }
    />
  )
  })
}
