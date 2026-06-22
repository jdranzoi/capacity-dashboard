'use client'

import { createSectionRoutePendingContext } from '@/components/ui/section-route-pending'

const {
  SectionRoutePendingShell,
  useSectionRoutePending,
} = createSectionRoutePendingContext()

export {
  SectionRoutePendingShell as ProjectsRoutePendingShell,
  useSectionRoutePending as useProjectsRoutePending,
}
