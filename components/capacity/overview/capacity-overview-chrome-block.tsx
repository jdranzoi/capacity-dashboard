import { connection } from 'next/server'

import { CapacityMonthPicker } from '@/components/capacity/_shared/capacity-month-picker'
import {
  CapacityDataError,
  CapacityEmptyMonths,
} from '@/components/capacity/_shared/capacity-data-error'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { getCapacityMonthSelection } from '@/lib/capacity/shared/capacity-page-cache'

export async function CapacityOverviewChromeBlock({
  monthStr,
}: {
  monthStr: string | undefined
}) {
  return perfSpan('capacity/overview/chrome', async () => {
    await connection()
    const { options, selected, error } = await getCapacityMonthSelection(monthStr)

    if (error) {
      return <CapacityDataError message={`Could not load month options: ${error}`} />
    }
    if (!selected) {
      return <CapacityEmptyMonths />
    }

    return (
      <DashboardSectionHeader
        title="Capacity overview"
        subtitle="Org capacity position and monthly trends"
        filters={
          <DashboardFilterField label="Period">
            <CapacityMonthPicker options={options} selectedMonthKey={selected.monthKey} />
          </DashboardFilterField>
        }
      />
    )
  })
}
