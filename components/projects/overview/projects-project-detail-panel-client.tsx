'use client'

import { ProjectsProjectDetailPanel } from '@/components/projects/overview/projects-project-detail-panel'
import type { ProjectDetailPanelPayload } from '@/lib/projects/overview/projects-types'

export function ProjectsProjectDetailPanelWithNav({
  detail,
}: {
  detail: ProjectDetailPanelPayload
}) {
  return <ProjectsProjectDetailPanel detail={detail} />
}
