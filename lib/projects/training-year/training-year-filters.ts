export type TrainingYearFilters = {
  monthKey: string | null
  roleKey: string | null
  versionKey: string | null
  componentKey: string | null
}

function firstString(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function pickTrainingYearSearchParams(
  raw: Record<string, string | string[] | undefined>
): TrainingYearFilters {
  const month = firstString(raw.month)
  const role = firstString(raw.role)
  const version = firstString(raw.version)
  const component = firstString(raw.component)
  return {
    monthKey: month && /^\d{4}-\d{2}$/.test(month) ? month : null,
    roleKey: role && role.length > 0 ? role : null,
    versionKey: version && version.length > 0 ? version : null,
    componentKey: component && component.length > 0 ? component : null,
  }
}

export function trainingYearSlotKey(filters: TrainingYearFilters): string {
  return [
    filters.monthKey ?? '',
    filters.roleKey ?? '',
    filters.versionKey ?? '',
    filters.componentKey ?? '',
  ].join('|')
}
