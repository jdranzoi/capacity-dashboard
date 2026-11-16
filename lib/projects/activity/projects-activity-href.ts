
export function monthKeyFromYearIndex(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function projectsActivityHref(params: { year: number; monthIndex: number }): string {
  const query = new URLSearchParams({
    month: monthKeyFromYearIndex(params.year, params.monthIndex),
  })
  return `/projects/activity?${query.toString()}`
}

export function openProjectsActivityTab(params: { year: number; monthIndex: number }): void {
  window.open(projectsActivityHref(params), '_blank', 'noopener,noreferrer')
}
