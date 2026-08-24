import type { ReactNode } from 'react'

import { TEAMS_COMPOSITION_STICKY_NAV_CLASS } from '@/components/teams/composition/teams-composition-layout'
import { TeamsCompositionViewToggle } from '@/components/teams/composition/teams-composition-view-toggle'
import type { CompositionView } from '@/lib/teams/composition/teams-composition-utils'

export function TeamsCompositionStickyNav({
  tabs,
  trailing,
  view,
}: {
  tabs: ReactNode
  trailing?: ReactNode
  view: CompositionView
}) {
  return (
    <div
      className={TEAMS_COMPOSITION_STICKY_NAV_CLASS}
      data-slot="teams-composition-anchor-nav-sticky"
    >
      <div className="min-w-0 flex-1">{tabs}</div>
      <div className="shrink-0">
        {trailing ?? <TeamsCompositionViewToggle view={view} compact />}
      </div>
    </div>
  )
}
