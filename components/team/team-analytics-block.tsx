import { connection } from 'next/server'
import { Suspense } from 'react'

import { TeamAnalyticsGrid } from '@/components/team/team-analytics-grid'
import { TeamDataError, TeamEmptyMonths } from '@/components/team/team-data-error'
import { TeamRouteSection } from '@/components/team/team-route-section'
import { TeamStaffingBlock } from '@/components/team/team-staffing-block'
import { TeamStaffingSkeleton } from '@/components/team/team-section-skeletons'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamRoleAnalyticsCached, getTeamMonthSelection } from '@/lib/team/team-page-cache'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export async function TeamAnalyticsBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamRouteFilters
}) {
  return perfSpan('team/analytics', async () => {
  await connection()
  const { selected, error: monthErr } = await getTeamMonthSelection(monthStr)
  if (monthErr) {
    return <TeamDataError message={`Could not load month options: ${monthErr}`} />
  }
  if (!selected) {
    return <TeamEmptyMonths />
  }

  const { data: rows, error } = await getTeamRoleAnalyticsCached(
    monthStr,
    routeFilters.roleKey,
    routeFilters.zoneKey,
    routeFilters.projectKey
  )

  if (error) {
    return <TeamDataError message={`Could not load role analytics: ${error}`} />
  }

  return (
    <section data-slot="team-analytics-grid" aria-labelledby="team-analytics-heading">
      <h2
        id="team-analytics-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Analytics
      </h2>
      <TeamAnalyticsGrid
        rows={rows ?? []}
        staffingSlot={
          <Suspense fallback={<TeamStaffingSkeleton />}>
            <TeamRouteSection fallback={<TeamStaffingSkeleton />}>
              <TeamStaffingBlock monthStr={monthStr} routeFilters={routeFilters} />
            </TeamRouteSection>
          </Suspense>
        }
      />
    </section>
  )
  })
}
