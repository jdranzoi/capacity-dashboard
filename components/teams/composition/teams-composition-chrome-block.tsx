import { connection } from 'next/server'

import { TeamsCompositionFilters } from '@/components/teams/composition/teams-composition-filters'
import { TeamsMonthPicker } from '@/components/teams/_shared/teams-month-picker'
import {
  TeamsDataError,
  TeamsEmptyMonths,
} from '@/components/teams/_shared/teams-data-error'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadCompositionFilterSuggestions } from '@/lib/teams/composition/load-composition-filter-suggestions'
import { getTeamsMonthContext } from '@/lib/teams/shared/teams-page-cache'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export async function TeamsCompositionChromeBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: TeamsRouteFilters
}) {
  return perfSpan('teams/composition/chrome', async () => {
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
      <DashboardSectionHeader
        title="Teams composition"
        subtitle="Project teams grouped by delivery type"
        filters={
          <div className="flex flex-wrap items-end gap-3" data-slot="teams-composition-filters">
            <DashboardFilterField label="Period">
              <TeamsMonthPicker options={ctx.data.options} selectedMonthKey={selected.monthKey} />
            </DashboardFilterField>
            <TeamsCompositionFilters
              routeFilters={routeFilters}
              suggestions={suggestionsResult.data}
            />
          </div>
        }
      />
    )
  })
}
