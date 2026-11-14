/** Severity stamped at sync (`fact_fragmentation.flagged`). Source: capacity-mcp ingestion. */
export type FragmentationSeverity = 'low' | 'moderate' | 'high'

export const FRAGMENTATION_SEVERITIES: readonly FragmentationSeverity[] = [
  'low',
  'moderate',
  'high',
]

/** Display labels for UI badges (mapped from DB severity). */
export type FragmentationLabel = 'Healthy' | 'Moderate' | 'High'

export const FRAGMENTATION_SEVERITY_TO_LABEL: Record<
  FragmentationSeverity,
  FragmentationLabel
> = {
  low: 'Healthy',
  moderate: 'Moderate',
  high: 'High',
}

/**
 * Rule stamped at sync (capacity-mcp `sync/capacity.ts`): commercial projects only;
 * consulting and outsourcing count as build. Logged projects for past and current months,
 * planned delivery projects for future months.
 */
export const FRAGMENTATION_LABEL_HINTS: Record<FragmentationLabel, string> = {
  Healthy:
    'One commercial project, or support-only work on up to three projects.',
  Moderate:
    'Exactly two commercial projects including a build, or exactly four support-only projects.',
  High:
    'More than two commercial projects including a build, or more than four support-only projects.',
}

export type FragmentationLabelBadgeVariant = 'secondary' | 'warning' | 'destructive'

export function isFragmentationSeverity(value: string): value is FragmentationSeverity {
  return value === 'low' || value === 'moderate' || value === 'high'
}

export function fragmentationSeverityFromFlagged(
  flagged: string | null | undefined
): FragmentationSeverity {
  if (flagged && isFragmentationSeverity(flagged)) return flagged
  return 'low'
}

export function fragmentationLabelFromSeverity(
  severity: FragmentationSeverity
): FragmentationLabel {
  return FRAGMENTATION_SEVERITY_TO_LABEL[severity]
}

export function fragmentationLabelFromFactRow(
  row: { flagged: string } | null | undefined
): FragmentationLabel {
  return fragmentationLabelFromSeverity(fragmentationSeverityFromFlagged(row?.flagged))
}

export function fragmentationLabelHint(label: FragmentationLabel): string {
  return FRAGMENTATION_LABEL_HINTS[label]
}

export function fragmentationLabelBadgeVariant(
  label: FragmentationLabel
): FragmentationLabelBadgeVariant {
  if (label === 'High') return 'destructive'
  if (label === 'Moderate') return 'warning'
  return 'secondary'
}
