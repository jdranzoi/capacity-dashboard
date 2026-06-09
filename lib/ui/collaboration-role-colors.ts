import { roleColorTokenForKey } from '@/lib/domain/role-keys'

/**
 * Collaboration network colors by `dim_role.key`.
 *
 * - Display names come from the loader (`dim_role.label`) — rename in DB, no code change.
 * - Known keys use curated `--collab-role-*` tokens (design-stable).
 * - Any other key gets a deterministic slot on `--collab-palette-*` (no deploy when roles are added).
 */

const UNASSIGNED_COLOR_VAR = 'var(--collab-role-unassigned)'

const COLLAB_PALETTE_SIZE = 8

/** Stable index in [0, COLLAB_PALETTE_SIZE) from role key string. */
function paletteIndexForRoleKey(roleKey: string): number {
  let hash = 5381
  for (let i = 0; i < roleKey.length; i++) {
    hash = (hash * 33) ^ roleKey.charCodeAt(i)
  }
  return Math.abs(hash) % COLLAB_PALETTE_SIZE
}

export function roleColorVar(roleKey: string): string {
  if (!roleKey || roleKey === 'unassigned') return UNASSIGNED_COLOR_VAR
  const token = roleColorTokenForKey(roleKey)
  if (token) return `var(--collab-role-${token})`
  return `var(--collab-palette-${paletteIndexForRoleKey(roleKey)})`
}
