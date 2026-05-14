export type TeamRouteFilters = {
  roleKey: string | null
  zoneKey: string | null
  projectKey: string | null
}

export function parseTeamRouteFilters(
  raw: Record<string, string | string[] | undefined>
): TeamRouteFilters {
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

export function teamRouteFiltersActive(f: TeamRouteFilters): boolean {
  return !!(f.roleKey ?? f.zoneKey ?? f.projectKey)
}
