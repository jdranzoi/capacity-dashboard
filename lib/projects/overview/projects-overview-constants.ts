import type { CompositionProjectType } from '@/lib/teams/composition/teams-composition-utils'

/** Projects overview space-type filter (no "All" — default is Build). */
export const PROJECTS_OVERVIEW_TYPE_OPTIONS: readonly {
  value: CompositionProjectType
  label: string
}[] = [
  { value: 'build', label: 'Build' },
  { value: 'support', label: 'Support' },
  { value: 'internal', label: 'Internal' },
]

export const DEFAULT_PROJECTS_CATEGORY: CompositionProjectType = 'build'
