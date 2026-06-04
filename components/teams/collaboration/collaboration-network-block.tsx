import { connection } from 'next/server'

import { CollaborationFilters } from '@/components/teams/collaboration/collaboration-filters'
import { CollaborationKpiRow } from '@/components/teams/collaboration/collaboration-kpi-row'
import { CollaborationNetworkExplorer } from '@/components/teams/collaboration/collaboration-network-explorer'
import { TeamsDataError, TeamsEmptyMonths } from '@/components/teams/_shared/teams-data-error'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadCollaborationNetwork } from '@/lib/teams/collaboration/load-collaboration-network'
import type { CollaborationRouteFilters } from '@/lib/teams/collaboration/collaboration-route-filters'
import type { FilterSuggestOption } from '@/lib/format/filter-suggest-utils'

export async function CollaborationNetworkBlock({
  filters,
}: {
  filters: CollaborationRouteFilters
}) {
  return perfSpan('teams/collaboration-network/block', async () => {
    await connection()
    const { data, error } = await loadCollaborationNetwork(filters)

    if (error) {
      return <TeamsDataError message={error} />
    }
    if (!data) {
      return <TeamsEmptyMonths />
    }

    const personSuggestions: FilterSuggestOption[] = data.nodes
      .map((node) => ({ value: node.name, label: node.name, hint: node.roleLabel }))
      .sort((a, b) => a.label.localeCompare(b.label, 'en'))

    return (
      <div className="flex flex-col gap-8">
        <DashboardSectionHeader
          title="Collaboration network"
          subtitle={`Planned staffing relationships across projects · ${data.monthLabel}`}
          filters={<CollaborationFilters data={data} personSuggestions={personSuggestions} />}
        />
        <CollaborationKpiRow kpis={data.kpis} />
        <CollaborationNetworkExplorer data={data} />
      </div>
    )
  })
}
