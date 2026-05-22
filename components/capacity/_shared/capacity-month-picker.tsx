'use client'

import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { useCapacityRoutePending } from '@/components/capacity/_shared/capacity-route-pending-shell'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function CapacityMonthPicker({
  options,
  selectedMonthKey,
}: {
  options: OverviewMonthOption[]
  selectedMonthKey: string
}) {
  const capacity = useCapacityRoutePending()

  return (
    <OverviewMonthPicker
      options={options}
      selectedMonthKey={selectedMonthKey}
      pendingNavigation={capacity}
    />
  )
}
