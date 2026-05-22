/** URL-backed person scope filters shared by Capacity and future People routes. */
export type PersonScopeFilters = {
  roleKey: string | null
  zoneKey: string | null
  projectKey: string | null
}

export function parsePersonScopeFilters(
  raw: Record<string, string | string[] | undefined>
): PersonScopeFilters {
  const one = (k: string): string | null => {
    const v = raw[k]
    const s = Array.isArray(v) ? v[0] : v
    const t = (s ?? '').trim()
    return t.length > 0 ? t : null
  }
  return {
    roleKey: one('role'),
    zoneKey: one('zone'),
    projectKey: one('project'),
  }
}

export function personScopeFiltersActive(f: PersonScopeFilters): boolean {
  return !!(f.roleKey ?? f.zoneKey ?? f.projectKey)
}
