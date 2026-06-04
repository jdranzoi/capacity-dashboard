/**
 * Collaboration network colors by `dim_role.key`.
 *
 * - Display names come from the loader (`dim_role.label`) — rename in DB, no code change.
 * - Known keys use curated `--collab-role-*` tokens (design-stable).
 * - Any other key gets a deterministic slot on `--collab-palette-*` (no deploy when roles are added).
 */

const KNOWN_ROLE_COLOR_VARS: Record<string, string> = {
  pm: 'var(--collab-role-pm)',
  tl: 'var(--collab-role-tl)',
  fsd: 'var(--collab-role-fsd)',
  fed: 'var(--collab-role-fed)',
  qa: 'var(--collab-role-qa)',
  ux: 'var(--collab-role-ux)',
  analytics: 'var(--collab-role-analytics)',
  em: 'var(--collab-role-em)',
}

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
  const known = KNOWN_ROLE_COLOR_VARS[roleKey]
  if (known) return known
  return `var(--collab-palette-${paletteIndexForRoleKey(roleKey)})`
}
