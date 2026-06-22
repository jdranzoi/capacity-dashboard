import { connection } from 'next/server'

import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
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
      return <SectionDataError message={`Could not load month options: ${error}`} />
    }
    if (!selected) {
      return <SectionEmptyState />
    }

    return (
      <DashboardSectionHeader
        title="Capacity overview"
        subtitle="Org capacity position and monthly trends"
        filters={
          <DashboardFilterField label="Period">
            <OverviewMonthPicker options={options} selectedMonthKey={selected.monthKey} />
          </DashboardFilterField>
        }
      />
    )
  })
}
