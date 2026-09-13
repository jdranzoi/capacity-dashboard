import { CapacityOverviewMonthStripToggle } from '@/components/capacity/overview/capacity-overview-month-strip-toggle'
import { CapacityOverviewKpiSection } from '@/components/capacity/overview/capacity-overview-kpi-section'
import type { CapacityOverviewPayload } from '@/lib/capacity/overview/load-capacity-overview'

export function CapacityOverviewMonthStrip({ data }: { data: CapacityOverviewPayload }) {
  return (
    <CapacityOverviewMonthStripToggle asOfDate={data.asOfDate}>
      <CapacityOverviewKpiSection data={data} />
    </CapacityOverviewMonthStripToggle>
  )
}
