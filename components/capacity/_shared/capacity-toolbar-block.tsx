import { connection } from 'next/server'

import { CapacityMonthPicker } from '@/components/capacity/_shared/capacity-month-picker'
import {
  CapacityDataError,
  CapacityEmptyMonths,
} from '@/components/capacity/_shared/capacity-data-error'
import { perfSpan } from '@/lib/dev/perf-log'
import { getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'

export async function CapacityToolbarBlock({
  monthStr,
}: {
  monthStr: string | undefined
}) {
  return perfSpan('capacity/toolbar', async () => {
    await connection()
    const { options, selected, error } = await getCapacityMonthSelection(monthStr)

    if (error) {
      return <CapacityDataError message={`Could not load month options: ${error}`} />
    }
    if (!selected) {
      return <CapacityEmptyMonths />
    }

    return (
      <div
        className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
        data-slot="capacity-toolbar"
      >
        <div className="flex min-w-[11.5rem] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Period
          </span>
          <CapacityMonthPicker options={options} selectedMonthKey={selected.monthKey} />
        </div>
      </div>
    )
  })
}
