import type { ReactNode } from 'react'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'

export function CapacityPlanningHeader({
  title,
  subtitle,
  periodPicker,
}: {
  title: string
  subtitle: string
  periodPicker: ReactNode
}) {
  return (
    <DashboardSectionHeader
      title={title}
      subtitle={subtitle}
      filters={periodPicker}
    />
  )
}
