import { connection } from 'next/server'

import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import {
  TeamsCompositionAlerts,
  TeamsCompositionGroups,
} from '@/components/teams/composition/teams-composition-groups'
import { getTeamsCompositionView } from '@/lib/teams/composition/get-teams-composition-view'
import type { CompositionView } from '@/lib/teams/composition/teams-composition-utils'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export async function TeamsCompositionBlock({
  monthStr,
  routeFilters,
  view,
}: {
  monthStr: string | undefined
  routeFilters: TeamsRouteFilters
  view: CompositionView
}) {
  await connection()
  const model = await getTeamsCompositionView(
    monthStr,
    routeFilters.personQuery,
    routeFilters.projectQuery,
    routeFilters.pmQuery,
    view
  )

  if (model.status === 'error') {
    return <SectionDataError message={model.message} />
  }
  if (model.status === 'empty') {
    return <SectionEmptyState />
  }

  return (
    <div className="flex flex-col gap-3">
      <TeamsCompositionAlerts data={model.data} />
      <TeamsCompositionGroups
        data={model.data}
        view={view}
        pmGroups={model.pmGroups}
      />
    </div>
  )
}
