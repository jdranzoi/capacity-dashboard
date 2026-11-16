/** List loader inputs only — excludes `project` so the main slot does not refetch on drill-down. */
export type ProjectsListSearchParams = {
  month?: string
  view?: string
  category?: string
  status?: string
  q?: string
  pm?: string
}

export function pickProjectsListSearchParams(
  raw: Record<string, string | string[] | undefined>
): ProjectsListSearchParams {
  const month = raw.month
  const view = raw.view
  const category = raw.category
  const status = raw.status
  const q = raw.q
  const pm = raw.pm

  return {
    month: Array.isArray(month) ? month[0] : month,
    view: Array.isArray(view) ? view[0] : view,
    category: Array.isArray(category) ? category[0] : category,
    status: Array.isArray(status) ? status[0] : status,
    q: Array.isArray(q) ? q[0] : q,
    pm: Array.isArray(pm) ? pm[0] : pm,
  }
}
