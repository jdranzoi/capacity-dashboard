const YEAR_COMPARE_SLOTS = 3

/** Current year is slot 0; each older year steps to the next `--year-compare-*` token. */
export function yearCompareColorVar(year: number, currentYear: number): string {
  const offset = Math.max(0, currentYear - year)
  const slot = Math.min(offset, YEAR_COMPARE_SLOTS - 1)
  return `var(--year-compare-${slot})`
}
