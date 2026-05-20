import { connection } from 'next/server'

import { TeamKpiSection } from '@/components/team/team-kpi-section'
import { TeamDataError, TeamEmptyMonths } from '@/components/team/team-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamMonthKpisCached, getTeamMonthSelection } from '@/lib/team/team-page-cache'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export async function TeamKpiBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamRouteFilters
}) {
  return perfSpan('team/kpis', async () => {
  await connection()
  const { selected, error: monthErr } = await getTeamMonthSelection(monthStr)
  if (monthErr) {
    return <TeamDataError message={`Could not load month options: ${monthErr}`} />
  }
  if (!selected) {
    return <TeamEmptyMonths />
  }

  const { data: kpis, error } = await getTeamMonthKpisCached(
    monthStr,
    routeFilters.roleKey,
    routeFilters.zoneKey,
    routeFilters.projectKey
  )

  if (error || !kpis) {
    return <TeamDataError message={error ?? 'Could not load team KPIs.'} />
  }

  return <TeamKpiSection kpis={kpis} />
  })
}
