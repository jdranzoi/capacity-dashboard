/**
 * Controlled role vocabulary from `dim_role.key` (capacity-mcp `006_v2_schema.sql`).
 * Person ↔ role joins use `dim_role.id`; keys are stable identifiers for filters and UI.
 */
export type DimRoleKey = 'fsd' | 'fed' | 'qa' | 'pm' | 'tl' | 'ux' | 'em' | 'ua'

export const DIM_ROLE_KEYS: readonly DimRoleKey[] = [
  'fsd',
  'fed',
  'qa',
  'pm',
  'tl',
  'ux',
  'em',
  'ua',
]

export const PM_ROLE_KEY = 'pm' as const satisfies DimRoleKey
export const TL_ROLE_KEY = 'tl' as const satisfies DimRoleKey

/** Roster / chart / legend sort order (`dim_role.key`). */
export const ROLE_DISPLAY_ORDER: readonly string[] = [
  PM_ROLE_KEY,
  TL_ROLE_KEY,
  'fsd',
  'fed',
  'qa',
  'ua',
  'ux',
  'em',
]

/**
 * Maps `dim_role.key` → `--collab-role-*` token suffix in `app/globals.css`.
 * `ua` uses the `analytics` design token (label is Analytics in dim_role).
 */
export const ROLE_COLOR_TOKEN_BY_KEY: Record<DimRoleKey, string> = {
  pm: 'pm',
  tl: 'tl',
  fsd: 'fsd',
  fed: 'fed',
  qa: 'qa',
  ux: 'ux',
  em: 'em',
  ua: 'analytics',
}

export type DimRoleMeta = {
  id: string
  key: string
  label: string
}

export function isDimRoleKey(value: string): value is DimRoleKey {
  return (DIM_ROLE_KEYS as readonly string[]).includes(value)
}

export function isPmRoleKey(roleKey: string): boolean {
  return roleKey === PM_ROLE_KEY
}

export function isTlRoleKey(roleKey: string): boolean {
  return roleKey === TL_ROLE_KEY
}

export function isLeadershipRoleKey(roleKey: string): boolean {
  return isPmRoleKey(roleKey) || isTlRoleKey(roleKey)
}

export function roleSortIndex(roleKey: string): number {
  const idx = ROLE_DISPLAY_ORDER.indexOf(roleKey)
  return idx === -1 ? ROLE_DISPLAY_ORDER.length : idx
}

/** Collaboration legend: PM and TL first, then alpha by label. */
export function legendRoleSortRank(roleKey: string): number {
  if (isPmRoleKey(roleKey)) return 0
  if (isTlRoleKey(roleKey)) return 1
  return 2
}

export function compareRoleKeysByDisplayOrder(a: string, b: string): number {
  const orderCmp = roleSortIndex(a) - roleSortIndex(b)
  if (orderCmp !== 0) return orderCmp
  return a.localeCompare(b, 'en')
}

export function roleColorTokenForKey(roleKey: string): string | null {
  if (!isDimRoleKey(roleKey)) return null
  return ROLE_COLOR_TOKEN_BY_KEY[roleKey]
}
