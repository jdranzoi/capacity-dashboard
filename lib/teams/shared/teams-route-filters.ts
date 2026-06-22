/** Teams routes use month scope plus optional composition filters. */
export type TeamsRouteFilters = {
  personQuery: string | null
  projectQuery: string | null
  pmQuery: string | null
}

export function parseTeamsRouteFilters(
  raw: Record<string, string | string[] | undefined>
): TeamsRouteFilters {
  const qParam = raw.q
  const qRaw = Array.isArray(qParam) ? qParam[0] : qParam
  const personQuery = qRaw?.trim() ? qRaw.trim() : null

  const projectParam = raw.project
  const projectRaw = Array.isArray(projectParam) ? projectParam[0] : projectParam
  const projectQuery = projectRaw?.trim() ? projectRaw.trim() : null

  const pmParam = raw.pm
  const pmRaw = Array.isArray(pmParam) ? pmParam[0] : pmParam
  const pmQuery = pmRaw?.trim() ? pmRaw.trim() : null

  return { personQuery, projectQuery, pmQuery }
}
