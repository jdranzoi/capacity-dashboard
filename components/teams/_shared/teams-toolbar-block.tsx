import { connection } from 'next/server'

import { TeamsMonthPicker } from '@/components/teams/_shared/teams-month-picker'
import {
  TeamsDataError,
  TeamsEmptyMonths,
} from '@/components/teams/_shared/teams-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamsMonthSelection } from '@/lib/teams/shared/teams-page-cache'

export async function TeamsToolbarBlock({ monthStr }: { monthStr: string | undefined }) {
  return perfSpan('teams/toolbar', async () => {
    await connection()
    const { options, selected, error } = await getTeamsMonthSelection(monthStr)

    if (error) {
      return <TeamsDataError message={`Could not load month options: ${error}`} />
    }
    if (!selected) {
      return <TeamsEmptyMonths />
    }

    return (
      <div
        className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
        data-slot="teams-toolbar"
      >
        <div className="flex min-w-[11.5rem] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Period
          </span>
          <TeamsMonthPicker options={options} selectedMonthKey={selected.monthKey} />
        </div>
      </div>
    )
  })
}
