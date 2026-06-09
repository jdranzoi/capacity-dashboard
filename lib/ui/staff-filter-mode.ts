export type StaffFilterMode = 'role' | 'name'

export const STAFF_FILTER_MODE_OPTIONS: readonly {
  value: StaffFilterMode
  label: string
}[] = [
  { value: 'role', label: 'Role' },
  { value: 'name', label: 'Name' },
]

/** Fixed slot for role select vs person name search so toolbar layout does not shift. */
export const STAFF_FILTER_DETAIL_WIDTH = 'w-44 shrink-0'
