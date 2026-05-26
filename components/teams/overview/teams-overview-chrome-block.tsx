import { connection } from 'next/server'

import { TeamsMonthPicker } from '@/components/teams/_shared/teams-month-picker'
import {
  TeamsDataError,
  TeamsEmptyMonths,
} from '@/components/teams/_shared/teams-data-error'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamsMonthSelection } from '@/lib/teams/shared/teams-page-cache'

export async function TeamsOverviewChromeBlock({
  monthStr,
}: {
  monthStr: string | undefined
}) {
  return perfSpan('teams/overview/chrome', async () => {
    await connection()
    const { options, selected, error } = await getTeamsMonthSelection(monthStr)

    if (error) {
      return <TeamsDataError message={`Could not load month options: ${error}`} />
    }
    if (!selected) {
      return <TeamsEmptyMonths />
    }

    return (
      <DashboardSectionHeader
        title="Teams overview"
        subtitle="Organizational structure for the planning roster"
        filters={
          <DashboardFilterField label="Period">
            <TeamsMonthPicker options={options} selectedMonthKey={selected.monthKey} />
          </DashboardFilterField>
        }
      />
    )
  })
}
