import { cache } from 'react'

import { perfSpan } from '@/lib/dev/perf-log'
import { loadTeamsComposition } from '@/lib/teams/composition/load-teams-composition'
import {
  buildPmGroups,
  compositionPmSectionId,
  compositionSectionId,
  flattenVisibleProjects,
  type CompositionView,
  type TeamsCompositionPayload,
  type TeamsCompositionPmGroup,
} from '@/lib/teams/composition/teams-composition-utils'
import { getTeamsMonthContext } from '@/lib/teams/shared/teams-page-cache'

export type TeamsCompositionViewAnchorItem = {
  id: string
  label: string
  count: number
}

export type TeamsCompositionViewModel =
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | {
      status: 'ok'
      data: TeamsCompositionPayload
      pmGroups: TeamsCompositionPmGroup[]
      anchorItems: TeamsCompositionViewAnchorItem[]
    }

export const getTeamsCompositionView = cache(
  async (
    monthStr: string | undefined,
    personQuery: string | null,
    projectQuery: string | null,
    pmQuery: string | null,
    view: CompositionView
  ): Promise<TeamsCompositionViewModel> => {
    return perfSpan('teams/composition', async () => {
      const ctx = await getTeamsMonthContext(monthStr)
      if (ctx.error) {
        return { status: 'error', message: ctx.error }
      }
      if (!ctx.data) {
        return { status: 'empty' }
      }

      const { selected, snapshot } = ctx.data
      const result = await loadTeamsComposition({
        monthStartStr: selected.monthStartStr,
        monthLabel: selected.label,
        snapshot,
        personQuery,
        projectQuery,
        pmQuery,
      })

      if (result.error || !result.data) {
        return {
          status: 'error',
          message: result.error ?? 'Could not load teams composition.',
        }
      }

      const data = result.data
      const pmGroups =
        view === 'pm'
          ? buildPmGroups(flattenVisibleProjects(data.groups), { pmQuery: data.pmQuery })
          : []
      const anchorItems =
        view === 'pm'
          ? pmGroups.map((group) => ({
              id: compositionPmSectionId(group.personId),
              label: group.personName,
              count: group.projects.length,
            }))
          : data.groups.map((group) => ({
              id: compositionSectionId(group.projectType),
              label: group.label,
              count: group.projects.length,
            }))

      return { status: 'ok', data, pmGroups, anchorItems }
    })
  }
)
