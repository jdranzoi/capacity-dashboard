export type CapacityRouteFilters = {
  roleKey: string | null
  zoneKey: string | null
  projectKey: string | null
  projectTypeKey: string | null
}

export function parseCapacityRouteFilters(
  raw: Record<string, string | string[] | undefined>
): CapacityRouteFilters {
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
    projectTypeKey: one('projectType'),
  }
}

export function capacityRouteFiltersActive(f: CapacityRouteFilters): boolean {
  return !!(f.roleKey ?? f.zoneKey ?? f.projectKey ?? f.projectTypeKey)
}

/** Maps capacity filters to person-scope resolver shape (`projectType` handled in Operations track). */
export function capacityFiltersForPersonScope(f: CapacityRouteFilters): {
  roleKey: string | null
  zoneKey: string | null
  projectKey: string | null
} {
  return {
    roleKey: f.roleKey,
    zoneKey: f.zoneKey,
    projectKey: f.projectKey,
  }
}
