import { connection } from 'next/server'

import {
  TeamsDataError,
  TeamsEmptyMonths,
} from '@/components/teams/_shared/teams-data-error'
import {
  TeamsCompositionAlerts,
  TeamsCompositionGroups,
} from '@/components/teams/composition/teams-composition-groups'
import { TeamsCompositionTypeNav } from '@/components/teams/composition/teams-composition-type-nav'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadTeamsComposition } from '@/lib/teams/composition/load-teams-composition'
import { getTeamsMonthContext } from '@/lib/teams/shared/teams-page-cache'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export async function TeamsCompositionBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamsRouteFilters
}) {
  return perfSpan('teams/composition', async () => {
    await connection()
    const ctx = await getTeamsMonthContext(monthStr)
    if (ctx.error) {
      return <TeamsDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <TeamsEmptyMonths />
    }

    const { selected, snapshot } = ctx.data
    const result = await loadTeamsComposition({
      monthStartStr: selected.monthStartStr,
      monthLabel: selected.label,
      snapshot,
      personQuery: routeFilters.personQuery,
      projectQuery: routeFilters.projectQuery,
    })

    if (result.error || !result.data) {
      return (
        <TeamsDataError message={result.error ?? 'Could not load teams composition.'} />
      )
    }

    const data = result.data

    return (
      <div className="flex flex-col gap-4" data-slot="teams-composition-section">
        <TeamsCompositionAlerts data={data} />
        <div
          className="sticky top-0 z-30 -mx-8 border-b border-border bg-background px-8 py-2.5 shadow-sm"
          data-slot="teams-composition-type-nav-sticky"
        >
          <TeamsCompositionTypeNav data={data} />
        </div>
        <TeamsCompositionGroups data={data} />
      </div>
    )
  })
}
