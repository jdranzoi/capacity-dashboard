export type FilterSuggestOption = {
  /** Value written to the URL when the option is chosen. */
  value: string
  label: string
  hint?: string | null
}

export function rankSuggestOptions(
  options: readonly FilterSuggestOption[],
  query: string,
  limit = 8
): FilterSuggestOption[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return options.slice(0, limit)
  }

  return options
    .map((opt) => {
      const label = opt.label.toLowerCase()
      const value = opt.value.toLowerCase()
      const hint = opt.hint?.toLowerCase() ?? ''
      let score = -1
      if (label.startsWith(q) || value.startsWith(q)) score = 0
      else if (label.includes(q) || value.includes(q) || hint.includes(q)) score = 1
      return { opt, score }
    })
    .filter((entry) => entry.score >= 0)
    .sort(
      (a, b) =>
        a.score - b.score || a.opt.label.localeCompare(b.opt.label, 'en')
    )
    .slice(0, limit)
    .map((entry) => entry.opt)
}
