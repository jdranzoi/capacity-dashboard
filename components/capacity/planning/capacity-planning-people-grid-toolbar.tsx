'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
import { PlannedUtilizationBandFilter } from '@/components/ui/planned-utilization-band-filter'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { RoleNameStaffFilter } from '@/components/ui/role-name-staff-filter'
import {
  PLANNING_TREE_OPTIONS,
} from '@/components/capacity/planning/planning-toolbar-primitives'
import type {
  PlanningTreeExpansion,
  PlanningUtilizationBand,
} from '@/lib/capacity/planning/planning-grid-filters'
import type { PlanningMonthVisibilityFilter } from '@/lib/capacity/planning/planning-month-visibility'
import type { StaffFilterMode } from '@/lib/ui/staff-filter-mode'

export function CapacityPlanningPeopleGridToolbar({
  mode,
  onModeChange,
  roleValue,
  onRoleChange,
  nameQuery,
  onNameQueryChange,
  roleOptions,
  utilBand,
  onUtilBandChange,
  monthKeys,
  monthLabels,
  monthVisibility,
  onMonthVisibilityChange,
  treeExpansion,
  onTreeExpansionChange,
}: {
  mode: StaffFilterMode
  onModeChange: (mode: StaffFilterMode) => void
  roleValue: string
  onRoleChange: (value: string) => void
  nameQuery: string
  onNameQueryChange: (value: string) => void
  roleOptions: string[]
  utilBand: PlanningUtilizationBand
  onUtilBandChange: (band: PlanningUtilizationBand) => void
  monthKeys: string[]
  monthLabels: Record<string, string>
  monthVisibility: PlanningMonthVisibilityFilter
  onMonthVisibilityChange: (value: PlanningMonthVisibilityFilter) => void
  treeExpansion: PlanningTreeExpansion
  onTreeExpansionChange: (value: PlanningTreeExpansion) => void
}) {
  return (
    <PlanningGridToolbarShell
      trailing={
        <SegmentedControl
          label="Tree"
          value={treeExpansion}
          onChange={onTreeExpansionChange}
          options={PLANNING_TREE_OPTIONS}
        />
      }
    >
      <RoleNameStaffFilter
        mode={mode}
        onModeChange={onModeChange}
        roleValue={roleValue}
        onRoleChange={onRoleChange}
        nameQuery={nameQuery}
        onNameQueryChange={onNameQueryChange}
        roleOptions={roleOptions}
      />

      <PlannedUtilizationBandFilter value={utilBand} onChange={onUtilBandChange} />

      <PlanningMonthVisibilityControl
        monthKeys={monthKeys}
        monthLabels={monthLabels}
        value={monthVisibility}
        onChange={onMonthVisibilityChange}
      />
    </PlanningGridToolbarShell>
  )
}
