import type { ReactNode } from 'react'

/**
 * Wraps case-insensitive query matches in a high-contrast marker background.
 * Safe for user-visible search terms in RSC output.
 */
export function highlightTextMatch(
  text: string,
  query: string | null | undefined
): ReactNode {
  const q = query?.trim()
  if (!q) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = q.toLowerCase()
  if (!lowerText.includes(lowerQuery)) return text

  const nodes: ReactNode[] = []
  let start = 0
  let matchIndex = 0

  while (start < text.length) {
    const index = lowerText.indexOf(lowerQuery, start)
    if (index === -1) {
      nodes.push(text.slice(start))
      break
    }

    if (index > start) {
      nodes.push(text.slice(start, index))
    }

    nodes.push(
      <mark
        key={`${index}-${matchIndex}`}
        className="rounded-[3px] bg-search-highlight px-1 py-px font-semibold text-search-highlight-foreground ring-1 ring-search-highlight-ring/70"
      >
        {text.slice(index, index + q.length)}
      </mark>
    )

    matchIndex += 1
    start = index + q.length
  }

  return nodes
}
