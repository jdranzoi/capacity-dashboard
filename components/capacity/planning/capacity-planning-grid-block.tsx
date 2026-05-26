import { connection } from 'next/server'

import {
  CapacityDataError,
  CapacityEmptyMonths,
} from '@/components/capacity/_shared/capacity-data-error'
import { CapacityPlanningPeopleGrid } from '@/components/capacity/planning/capacity-planning-people-grid'
import { CapacityPlanningProjectGrid } from '@/components/capacity/planning/capacity-planning-project-grid'
import { DataSectionPanel, DataSectionPanelHeader } from '@/components/ui/data-section-panel'
import { loadPlanningWorkspaceCached } from '@/lib/capacity/planning/load-planning-workspace'
import { parsePlanningView } from '@/lib/capacity/planning/planning-route-period'
import type { PlanningView } from '@/lib/capacity/planning/planning-types'

function collectRoleOptions(
  peopleTree: { label: string; kind: string; subRows?: { label: string }[] }[]
): string[] {
  const roles = new Set<string>()
  for (const row of peopleTree) {
    if (row.kind === 'role') roles.add(row.label)
  }
  return Array.from(roles).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

export async function CapacityPlanningGridBlock({
  fromParam,
  toParam,
  viewParam,
}: {
  fromParam?: string
  toParam?: string
  viewParam?: string | string[]
}) {
  await connection()

  const view: PlanningView = parsePlanningView(viewParam)
  const workspaceResult = await loadPlanningWorkspaceCached(fromParam, toParam)

  if (workspaceResult.error) return <CapacityDataError message={workspaceResult.error} />
  if (!workspaceResult.data) return <CapacityEmptyMonths />

  const data = workspaceResult.data
  const roleOptions = collectRoleOptions(data.peopleTreeRows)

  return (
    <DataSectionPanel dataSlot="capacity-planning-grid" className="gap-0 overflow-hidden p-0">
      <div className="border-b border-border/70 px-4 py-3">
        <DataSectionPanelHeader
          title={view === 'people' ? 'People planning grid' : 'Project planning grid'}
          description={
            view === 'people'
              ? 'Role and person workload across the selected period.'
              : 'Project commitments by role and person across the selected period.'
          }
        />
      </div>
      <div>
        {view === 'people' ? (
          <CapacityPlanningPeopleGrid
            rows={data.peopleTreeRows}
            monthKeys={data.period.monthKeys}
            monthLabels={data.period.monthLabels}
            roleOptions={roleOptions}
          />
        ) : (
          <CapacityPlanningProjectGrid
            rows={data.projectTreeRows}
            monthKeys={data.period.monthKeys}
            monthLabels={data.period.monthLabels}
            roleOptions={roleOptions}
          />
        )}
      </div>
    </DataSectionPanel>
  )
}
