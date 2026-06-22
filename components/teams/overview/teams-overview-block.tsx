import { connection } from 'next/server'

import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { TeamsOverviewDistributionSection } from '@/components/teams/overview/teams-overview-distribution-section'
import { TeamsOverviewFutureSection } from '@/components/teams/overview/teams-overview-future-section'
import { TeamsOverviewKpiSection } from '@/components/teams/overview/teams-overview-kpi-section'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadTeamsOverview } from '@/lib/teams/overview/load-teams-overview'
import { getTeamsMonthContext } from '@/lib/teams/shared/teams-page-cache'

export async function TeamsOverviewBlock({ monthStr }: { monthStr: string | undefined }) {
  return perfSpan('teams/overview', async () => {
    await connection()
    const ctx = await getTeamsMonthContext(monthStr)
    if (ctx.error) {
      return <SectionDataError message={ctx.error} />
    }
    if (!ctx.data) {
      return <SectionEmptyState />
    }

    const { selected, snapshot, monthEndStr } = ctx.data
    const result = await loadTeamsOverview({
      monthStartStr: selected.monthStartStr,
      monthEndStr,
      monthLabel: selected.label,
      snapshot,
    })

    if (result.error || !result.data) {
      return (
        <SectionDataError message={result.error ?? 'Could not load teams overview.'} />
      )
    }

    const data = result.data

    return (
      <div className="flex flex-col gap-6">
        <TeamsOverviewKpiSection data={data} />
        <TeamsOverviewDistributionSection data={data} />
        <TeamsOverviewFutureSection />
      </div>
    );
  })
}
