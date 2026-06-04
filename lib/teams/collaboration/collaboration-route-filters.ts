/** URL-state for `/teams/collaboration-network`. */

export const COLLABORATION_CATEGORY_ALL = 'all'

export type CollaborationRouteFilters = {
  /** `yyyy-MM` from `?month=` when valid in the picker list. */
  monthParam: string | undefined
  /** `all` or a `dim_project.project_type` value. */
  category: string
  personQuery: string | null
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined
  return Array.isArray(value) ? value[0] : value
}

export function parseCollaborationRouteFilters(
  raw: Record<string, string | string[] | undefined>
): CollaborationRouteFilters {
  const monthRaw = firstParam(raw.month)?.trim()
  const monthParam =
    monthRaw && /^\d{4}-\d{2}$/.test(monthRaw) ? monthRaw : undefined

  const categoryRaw = firstParam(raw.category)?.trim().toLowerCase()
  const category = categoryRaw && categoryRaw.length > 0 ? categoryRaw : COLLABORATION_CATEGORY_ALL

  const q = firstParam(raw.q)?.trim()
  const personQuery = q && q.length > 0 ? q : null

  return { monthParam, category, personQuery }
}
