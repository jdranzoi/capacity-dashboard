import { connection } from 'next/server'

import { TeamToolbar } from '@/components/team/team-toolbar'
import { TeamDataError, TeamEmptyMonths } from '@/components/team/team-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamPageBootstrap } from '@/lib/team/team-page-cache'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export async function TeamToolbarBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamRouteFilters
}) {
  return perfSpan('team/toolbar', async () => {
  await connection()
  const boot = await getTeamPageBootstrap(
    monthStr,
    routeFilters.roleKey,
    routeFilters.zoneKey,
    routeFilters.projectKey
  )

  if (boot.error) {
    return <TeamDataError message={boot.error} />
  }
  if (!boot.data) {
    return <TeamEmptyMonths />
  }

  const { options, selected, filterOptions } = boot.data

  return (
    <TeamToolbar
      monthPicker={{ options, selectedMonthKey: selected.monthKey }}
      filterOptions={filterOptions}
      routeFilters={routeFilters}
    />
  )
  })
}
