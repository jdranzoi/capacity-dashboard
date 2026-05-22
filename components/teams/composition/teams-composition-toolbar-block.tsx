import { connection } from 'next/server'

import { TeamsCompositionFilters } from '@/components/teams/composition/teams-composition-filters'
import { TeamsMonthPicker } from '@/components/teams/_shared/teams-month-picker'
import {
  TeamsDataError,
  TeamsEmptyMonths,
} from '@/components/teams/_shared/teams-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadCompositionFilterSuggestions } from '@/lib/teams/composition/load-composition-filter-suggestions'
import { getTeamsMonthContext } from '@/lib/teams/shared/teams-page-cache'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export async function TeamsCompositionToolbarBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamsRouteFilters
}) {
  return perfSpan('teams/composition/toolbar', async () => {
    await connection()
    const ctx = await getTeamsMonthContext(monthStr)
    if (ctx.error) {
      return <TeamsDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <TeamsEmptyMonths />
    }

    const { selected } = ctx.data
    const suggestionsResult = await loadCompositionFilterSuggestions({
      monthStartStr: selected.monthStartStr,
      snapshotId: selected.snapshotId,
    })

    if (suggestionsResult.error || !suggestionsResult.data) {
      return (
        <TeamsDataError
          message={suggestionsResult.error ?? 'Could not load composition filter suggestions.'}
        />
      )
    }

    return (
      <div
        className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
        data-slot="teams-composition-toolbar"
      >
        <div className="flex min-w-[11.5rem] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Period
          </span>
          <TeamsMonthPicker options={ctx.data.options} selectedMonthKey={selected.monthKey} />
        </div>
        <TeamsCompositionFilters
          routeFilters={routeFilters}
          suggestions={suggestionsResult.data}
        />
      </div>
    )
  })
}
