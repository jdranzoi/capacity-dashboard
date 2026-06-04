/** Presentation-only formatter for `fact_fragmentation.flagged` (no classification rules). */

export function formatFragmentationFlagged(flagged: boolean | null): string {
  if (flagged == null) return '—'
  return flagged ? 'Yes' : 'No'
}
