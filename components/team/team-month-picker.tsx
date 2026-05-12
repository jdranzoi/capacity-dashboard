'use client'

import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { useTeamRoutePending } from '@/components/team/team-route-pending-shell'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function TeamMonthPicker({
  options,
  selectedMonthKey,
}: {
  options: OverviewMonthOption[]
  selectedMonthKey: string
}) {
  const team = useTeamRoutePending()

  return (
    <OverviewMonthPicker
      options={options}
      selectedMonthKey={selectedMonthKey}
      pendingNavigation={team}
    />
  )
}
