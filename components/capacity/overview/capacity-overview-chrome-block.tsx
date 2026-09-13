import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { perfSpan } from '@/lib/dev/perf-log'

export async function CapacityOverviewChromeBlock() {
  return perfSpan('capacity/overview/chrome', async () => {
    await connection()
    return (
      <DashboardSectionHeader
        title="Capacity overview"
        subtitle="Current-month position and same-period year comparison"
      />
    )
  })
}
