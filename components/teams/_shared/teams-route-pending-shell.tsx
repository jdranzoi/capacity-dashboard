'use client'

import { createSectionRoutePendingContext } from '@/components/ui/section-route-pending'

const {
  SectionRoutePendingShell,
  SectionRouteSection,
  useSectionRoutePending,
} = createSectionRoutePendingContext()

export {
  SectionRoutePendingShell as TeamsRoutePendingShell,
  SectionRouteSection as TeamsRouteSection,
  useSectionRoutePending as useTeamsRoutePending,
}
