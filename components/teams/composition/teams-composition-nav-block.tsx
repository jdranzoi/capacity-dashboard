import { connection } from 'next/server'

import { TeamsCompositionAnchorNav } from '@/components/teams/composition/teams-composition-type-nav'
import { getTeamsCompositionView } from '@/lib/teams/composition/get-teams-composition-view'
import type { CompositionView } from '@/lib/teams/composition/teams-composition-utils'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export async function TeamsCompositionNavBlock({
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

  if (model.status !== 'ok') {
    return null
  }

  return (
    <TeamsCompositionAnchorNav
      items={model.anchorItems}
      ariaLabel={view === 'pm' ? 'Project manager sections' : 'Project type sections'}
    />
  )
}
