'use client'

import { PlanningGridToolbarShell } from '@/components/capacity/planning/planning-grid-toolbar-shell'
import { PlanningMonthVisibilityControl } from '@/components/capacity/planning/planning-month-visibility-control'
import { PlanningSegmentedControl } from '@/components/capacity/planning/planning-segmented-control'
import { PLANNING_TREE_OPTIONS } from '@/components/capacity/planning/planning-toolbar-primitives'
import type {
  PlanningProjectTypeFilter,
  PlanningTreeExpansion,
} from '@/lib/capacity/planning/planning-grid-filters'
import type { PlanningMonthVisibilityFilter } from '@/lib/capacity/planning/planning-month-visibility'

const PROJECT_TYPE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'build' as const, label: 'Build' },
  { value: 'support' as const, label: 'Support' },
  { value: 'internal' as const, label: 'Internal' },
]

export function CapacityPlanningProjectGridToolbar({
  projectType,
  onProjectTypeChange,
  monthKeys,
  monthLabels,
  monthVisibility,
  onMonthVisibilityChange,
  treeExpansion,
  onTreeExpansionChange,
}: {
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
        <PlanningSegmentedControl
          label="Tree"
          value={treeExpansion}
          onChange={onTreeExpansionChange}
          options={PLANNING_TREE_OPTIONS}
        />
      }
    >
      <PlanningSegmentedControl
        label="Project type"
        value={projectType}
        onChange={onProjectTypeChange}
        options={PROJECT_TYPE_OPTIONS}
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
