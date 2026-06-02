'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  PLANNING_PROJECT_TYPE_OPTIONS,
  PLANNING_ROLE_NAME_FILTER_WIDTH,
  PLANNING_TREE_OPTIONS,
  PlanningToolbarSearch,
  PlanningToolbarSelect,
} from '@/components/capacity/planning/planning-toolbar-primitives'
import type {
  PlanningProjectTypeFilter,
  PlanningStaffFilterMode,
  PlanningTreeExpansion,
} from '@/lib/capacity/planning/planning-grid-filters'
import type { PlanningMonthVisibilityFilter } from '@/lib/capacity/planning/planning-month-visibility'

const FILTER_BY_OPTIONS = [
  { value: 'role' as const, label: 'Role' },
  { value: 'name' as const, label: 'Name' },
]

export function CapacityPlanningProjectGridToolbar({
  filterMode,
  onFilterModeChange,
  roleValue,
  onRoleChange,
  nameQuery,
  onNameQueryChange,
  roleOptions,
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
      <SegmentedControl
        label="Filter by"
        value={filterMode}
        onChange={onFilterModeChange}
        options={FILTER_BY_OPTIONS}
      />

      <div className={PLANNING_ROLE_NAME_FILTER_WIDTH}>
        {filterMode === 'role' ? (
          <PlanningToolbarSelect
            label="Role"
            value={roleValue}
            onChange={onRoleChange}
            className="w-full"
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </PlanningToolbarSelect>
        ) : (
          <PlanningToolbarSearch
            label="Person name"
            value={nameQuery}
            onChange={onNameQueryChange}
            placeholder="Search people…"
            className="w-full"
          />
        )}
      </div>

      <SegmentedControl
        label="Project type"
        value={projectType}
        onChange={onProjectTypeChange}
        options={PLANNING_PROJECT_TYPE_OPTIONS}
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
