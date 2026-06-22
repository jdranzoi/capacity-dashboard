'use client'

import { createSectionRoutePendingContext } from '@/components/ui/section-route-pending'

const {
  SectionRoutePendingShell,
  SectionRouteSection,
  useSectionRoutePending,
} = createSectionRoutePendingContext()

export {
  SectionRoutePendingShell as OverviewRoutePendingShell,
  SectionRouteSection as OverviewRouteSection,
  useSectionRoutePending as useOverviewRoutePending,
}
