'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  PLANNING_ROLE_NAME_FILTER_WIDTH,
  PLANNING_TREE_OPTIONS,
  PlanningToolbarSearch,
  PlanningToolbarSelect,
} from '@/components/capacity/planning/planning-toolbar-primitives'
import type {
  PlanningTreeExpansion,
  PlanningUtilizationBand,
} from '@/lib/capacity/planning/planning-grid-filters'
import type { PlanningMonthVisibilityFilter } from '@/lib/capacity/planning/planning-month-visibility'

export type PeopleGridFilterMode = 'role' | 'name'

const FILTER_BY_OPTIONS = [
  { value: 'role' as const, label: 'Role' },
  { value: 'name' as const, label: 'Name' },
]

const UTIL_BAND_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'lt40' as const, label: '<40' },
  { value: 'lt65' as const, label: '<65' },
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
  mode: PeopleGridFilterMode
  onModeChange: (mode: PeopleGridFilterMode) => void
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
      <SegmentedControl
        label="Filter by"
        value={mode}
        onChange={onModeChange}
        options={FILTER_BY_OPTIONS}
      />

      <div className={PLANNING_ROLE_NAME_FILTER_WIDTH}>
        {mode === 'role' ? (
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
