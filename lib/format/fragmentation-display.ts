import {
  fragmentationLabelFromSeverity,
  type FragmentationSeverity,
} from '@/lib/domain/fragmentation-label'

/** Maps `fact_fragmentation.flagged` severity to a user-facing label. */
export function formatFragmentationSeverity(
  severity: FragmentationSeverity | null | undefined
): string {
  if (!severity) return '—'
  return fragmentationLabelFromSeverity(severity)
}
