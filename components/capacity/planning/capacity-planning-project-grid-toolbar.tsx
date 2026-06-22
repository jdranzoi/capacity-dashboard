'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
import { PlanningToolbarSelect } from '@/components/capacity/planning/planning-toolbar-primitives'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { RoleNameStaffFilter } from '@/components/ui/role-name-staff-filter'
import {
  PLANNING_TREE_OPTIONS,
} from '@/components/capacity/planning/planning-toolbar-primitives'
import { PROJECT_SPACE_TYPE_FILTER_OPTIONS } from '@/lib/domain/project-types'
import type {
  PlanningProjectTypeFilter,
  PlanningStaffFilterMode,
  PlanningTreeExpansion,
} from '@/lib/capacity/planning/planning-grid-filters'
import type { PlanningMonthVisibilityFilter } from '@/lib/capacity/planning/planning-month-visibility'

export function CapacityPlanningProjectGridToolbar({
  filterMode,
  onFilterModeChange,
  roleValue,
  onRoleChange,
  nameQuery,
  onNameQueryChange,
  roleOptions,
  pmValue,
  onPmChange,
  pmOptions,
  projectType,
  onProjectTypeChange,
  monthKeys,
  monthLabels,
  monthVisibility,
  onMonthVisibilityChange,
  treeExpansion,
  onTreeExpansionChange,
}: {
  filterMode: PlanningStaffFilterMode
  onFilterModeChange: (mode: PlanningStaffFilterMode) => void
  roleValue: string
  onRoleChange: (value: string) => void
  nameQuery: string
  onNameQueryChange: (value: string) => void
  roleOptions: string[]
  pmValue: string
  onPmChange: (value: string) => void
  pmOptions: string[]
  projectType: PlanningProjectTypeFilter
  onProjectTypeChange: (value: PlanningProjectTypeFilter) => void
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
        mode={filterMode}
        onModeChange={onFilterModeChange}
        roleValue={roleValue}
        onRoleChange={onRoleChange}
        nameQuery={nameQuery}
        onNameQueryChange={onNameQueryChange}
        roleOptions={roleOptions}
      />

      <PlanningToolbarSelect
        label="Project manager"
        value={pmValue}
        onChange={onPmChange}
        className="w-[11rem]"
      >
        <option value="">All PMs</option>
        {pmOptions.map((pm) => (
          <option key={pm} value={pm}>
            {pm}
          </option>
        ))}
      </PlanningToolbarSelect>

      <SegmentedControl
        label="Project type"
        value={projectType}
        onChange={onProjectTypeChange}
        options={PROJECT_SPACE_TYPE_FILTER_OPTIONS}
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
