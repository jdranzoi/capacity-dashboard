/** Teams routes use month-only scope in Phase 1 (no role/zone URL filters). */
export type TeamsRouteFilters = Record<string, never>

export function parseTeamsRouteFilters(
  _raw: Record<string, string | string[] | undefined>
): TeamsRouteFilters {
  return {}
}
