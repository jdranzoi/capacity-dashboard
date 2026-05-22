'use client'

import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { useTeamsRoutePending } from '@/components/teams/_shared/teams-route-pending-shell'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function TeamsMonthPicker({
  options,
  selectedMonthKey,
}: {
  options: OverviewMonthOption[]
  selectedMonthKey: string
}) {
  const teams = useTeamsRoutePending()

  return (
    <OverviewMonthPicker
      options={options}
      selectedMonthKey={selectedMonthKey}
      pendingNavigation={teams}
    />
  )
}
