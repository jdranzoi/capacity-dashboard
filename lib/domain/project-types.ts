export type ProjectSpaceType = 'build' | 'support' | 'internal' | 'product'

export const OTHER_PROJECT_TYPE = 'other'

export type ActivityProjectType = ProjectSpaceType | typeof OTHER_PROJECT_TYPE

export type ProjectSpaceTypeFilter = 'all' | ProjectSpaceType

export type ActivityProjectTypeFilter = 'all' | ActivityProjectType

export const PROJECT_SPACE_TYPES: readonly {
  value: ProjectSpaceType
  label: string
}[] = [
  { value: 'build', label: 'Build' },
  { value: 'support', label: 'Support' },
  { value: 'internal', label: 'Internal' },
  { value: 'product', label: 'Product' },
]

export const ACTIVITY_PROJECT_TYPE_ORDER: readonly ActivityProjectType[] = [
  'build',
  'support',
  'product',
  'internal',
  OTHER_PROJECT_TYPE,
]

export const PROJECT_SPACE_TYPE_FILTER_OPTIONS: readonly {
  value: ProjectSpaceTypeFilter
  label: string
}[] = [{ value: 'all', label: 'All' }, ...PROJECT_SPACE_TYPES]

export const DEFAULT_PROJECT_SPACE_TYPE: ProjectSpaceType = 'build'

export function isProjectSpaceType(value: string): value is ProjectSpaceType {
  return PROJECT_SPACE_TYPES.some((entry) => entry.value === value)
}

export function projectSpaceTypeLabel(value: string): string {
  if (!isProjectSpaceType(value)) return value
  return PROJECT_SPACE_TYPES.find((entry) => entry.value === value)?.label ?? value
}

export function activityProjectTypeKey(value: string | null): ActivityProjectType {
  if (value && isProjectSpaceType(value)) return value
  return OTHER_PROJECT_TYPE
}

export function activityProjectTypeLabel(value: string): string {
  if (value === OTHER_PROJECT_TYPE) return 'Other'
  return projectSpaceTypeLabel(value)
}

export function isActivityProjectType(value: string): value is ActivityProjectType {
  return isProjectSpaceType(value) || value === OTHER_PROJECT_TYPE
}
