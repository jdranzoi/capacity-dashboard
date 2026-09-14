'use client'

import { ProjectsActivityTypeTable } from '@/components/projects/activity/projects-activity-type-table'
import { DataSectionPanel, DataSectionPanelHeader } from '@/components/ui/data-section-panel'
import type { ProjectsActivityPayload } from '@/lib/projects/activity/activity-types'

export function ProjectsActivityGridBody({
  payload,
}: {
  payload: ProjectsActivityPayload
}) {
  return (
    <DataSectionPanel dataSlot="projects-activity-grid" className="gap-4">
      <DataSectionPanelHeader
        title={`Logged in ${payload.monthLabel}`}
        description="Distinct projects with non-PTO Tempo hours. Grouped by project type."
      />
      {payload.groups.length === 0 ? (
        <p className="text-xs text-muted-foreground">No projects logged hours in this month.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {payload.groups.map((group) => (
            <ProjectsActivityTypeTable key={group.type} group={group} />
          ))}
        </div>
      )}
    </DataSectionPanel>
  )
}
