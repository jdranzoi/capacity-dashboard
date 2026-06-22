'use client'

import { createSectionRoutePendingContext } from '@/components/ui/section-route-pending'

const {
  SectionRoutePendingShell,
  SectionRouteSection,
  useSectionRoutePending,
} = createSectionRoutePendingContext()

export {
  SectionRoutePendingShell as CapacityRoutePendingShell,
  SectionRouteSection as CapacityRouteSection,
  useSectionRoutePending as useCapacityRoutePending,
}
