/** Nullable numeric sort for TanStack `sortingFn`. Nulls sort last. */
export function compareNullableNumber(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}
