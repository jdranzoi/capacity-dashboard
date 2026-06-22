import { connection } from 'next/server'

import { TeamsCompositionFilters } from '@/components/teams/composition/teams-composition-filters'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
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
      return <SectionDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <SectionEmptyState />
    }

    const { selected } = ctx.data
    const suggestionsResult = await loadCompositionFilterSuggestions({
      monthStartStr: selected.monthStartStr,
      snapshotId: selected.snapshotId,
    })

    if (suggestionsResult.error || !suggestionsResult.data) {
      return (
        <SectionDataError
          message={suggestionsResult.error ?? 'Could not load composition filter suggestions.'}
        />
      )
    }

    return (
      <DashboardSectionHeader
        title="Teams composition"
        subtitle="Project teams grouped by delivery type"
        filters={
          <TeamsCompositionFilters
            monthOptions={ctx.data.options}
            monthKey={selected.monthKey}
            routeFilters={routeFilters}
            suggestions={suggestionsResult.data}
          />
        }
      />
    )
  })
}
