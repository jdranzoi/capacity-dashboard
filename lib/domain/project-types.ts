/**
 * Project type vocabulary (D-033). Keys and labels come from `dim_project_type`
 * (loaded by `lib/data/load-project-types.ts`); `dim_project.project_type`
 * references its key, so every project has a type in the vocabulary.
 */

export type ProjectTypeOption = {
  value: string
  label: string
  isCommercial: boolean
}

/** Build projects use the lifetime delivery window (budget, burn, plan variance). */
export const BUILD_PROJECT_TYPE = 'build'

/** Projects without a Jira category; always listed last. */
export const UNCLASSIFIED_PROJECT_TYPE = 'unclassified'

/** Commercial types first, `unclassified` last, then by label. */
export function compareProjectTypes(a: ProjectTypeOption, b: ProjectTypeOption): number {
  const aLast = a.value === UNCLASSIFIED_PROJECT_TYPE
  const bLast = b.value === UNCLASSIFIED_PROJECT_TYPE
  if (aLast !== bLast) return aLast ? 1 : -1
  if (a.isCommercial !== b.isCommercial) return a.isCommercial ? -1 : 1
  return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
}

export function projectTypeLabel(types: readonly ProjectTypeOption[], value: string): string {
  return types.find((type) => type.value === value)?.label ?? value
}

/** Vocabulary entries that have at least one project, in vocabulary order. */
export function presentProjectTypes(
  types: readonly ProjectTypeOption[],
  projectTypes: Iterable<string>
): ProjectTypeOption[] {
  const present = new Set(projectTypes)
  return types.filter((type) => present.has(type.value))
}
