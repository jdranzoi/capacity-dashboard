'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
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

const UTIL_BAND_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'lt40' as const, label: '<40' },
  { value: 'lt60' as const, label: '<60' },
  { value: 'lt80' as const, label: '<80' },
  { value: 'gt80' as const, label: '>80' },
]

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

      <SegmentedControl
        label="Utilization"
        value={utilBand}
        onChange={onUtilBandChange}
        options={UTIL_BAND_OPTIONS}
      />

      <PlanningMonthVisibilityControl
        monthKeys={monthKeys}
        monthLabels={monthLabels}
        value={monthVisibility}
        onChange={onMonthVisibilityChange}
      />
    </PlanningGridToolbarShell>
  )
}
