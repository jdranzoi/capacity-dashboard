export type ProjectSpaceType = 'build' | 'support' | 'internal' | 'product'

export type ProjectSpaceTypeFilter = 'all' | ProjectSpaceType

export const PROJECT_SPACE_TYPES: readonly {
  value: ProjectSpaceType
  label: string
}[] = [
  { value: 'build', label: 'Build' },
  { value: 'support', label: 'Support' },
  { value: 'internal', label: 'Internal' },
  { value: 'product', label: 'Product' },
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
