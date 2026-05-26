import type { ReactNode } from 'react'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'

/** @deprecated Prefer route chrome blocks with `DashboardSectionHeader` and master filters on the right. */
export function TeamsHeaderBlock({
  title,
  subtitle,
  filters,
}: {
  title: string
  subtitle: string
  filters?: ReactNode
}) {
  return <DashboardSectionHeader title={title} subtitle={subtitle} filters={filters} />
}
