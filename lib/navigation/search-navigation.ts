import {
  NAV_ASK,
  NAV_DOMAINS,
  NAV_OVERVIEW,
  type NavigationCatalogItem,
} from '@/lib/navigation/navigation-catalog'
import { isSidebarNavItemVisible } from '@/lib/navigation/sidebar-nav-config'

export type NavigationSearchEntry = NavigationCatalogItem & {
  searchText: string
}

const LABEL_MATCH_MIN_SCORE = 300

function buildSearchText(entry: NavigationCatalogItem): string {
  return `${entry.label} ${entry.description} ${entry.breadcrumb}`.toLowerCase()
}

function domainLandingEntry(domain: (typeof NAV_DOMAINS)[number]): NavigationSearchEntry {
  const entry: NavigationCatalogItem = {
    label: domain.label,
    href: `/${domain.id}`,
    description: domain.description,
    breadcrumb: NAV_OVERVIEW.breadcrumb,
    icon: domain.icon,
  }
  return {
    ...entry,
    searchText: `${entry.label} ${entry.description} ${domain.coreQuestion} ${entry.breadcrumb}`.toLowerCase(),
  }
}

/** Flat index: level-1 domains, level-2 routes, overview, and ask. */
export function buildNavigationSearchIndex(): NavigationSearchEntry[] {
  const entries: NavigationSearchEntry[] = [
    { ...NAV_OVERVIEW, searchText: buildSearchText(NAV_OVERVIEW) },
    ...NAV_DOMAINS.map(domainLandingEntry),
    ...NAV_DOMAINS.flatMap((domain) =>
      domain.items.map((item) => ({
        ...item,
        icon: item.icon ?? domain.icon,
        searchText: buildSearchText(item),
      }))
    ),
    { ...NAV_ASK, searchText: buildSearchText(NAV_ASK) },
  ]

  return entries
}

const NAV_SEARCH_INDEX = buildNavigationSearchIndex()

/**
 * Score a catalog entry for a query. Higher = better match.
 * Label matches dominate; description-only matches rank low.
 */
function scoreNavigationEntry(entry: NavigationSearchEntry, tokens: string[]): number {
  const label = entry.label.toLowerCase()
  const labelWords = label.split(/\s+/)
  const breadcrumb = entry.breadcrumb.toLowerCase()
  const description = entry.description.toLowerCase()

  let total = 0

  for (const token of tokens) {
    let tokenScore = -1

    if (label === token) {
      tokenScore = 1000
    } else if (labelWords.some((word) => word === token)) {
      tokenScore = 500
    } else if (label.startsWith(token)) {
      tokenScore = 400
    } else if (label.includes(token)) {
      tokenScore = 300
    } else if (breadcrumb.includes(token)) {
      tokenScore = 120
    } else if (description.includes(token)) {
      tokenScore = 15
    }

    if (tokenScore < 0) {
      return -1
    }

    total += tokenScore
  }

  return total
}

export function searchNavigation(query: string, limit = 8): NavigationSearchEntry[] {
  const visibleIndex = NAV_SEARCH_INDEX.filter((entry) =>
    isSidebarNavItemVisible(entry.href, entry.status)
  )

  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) {
    return visibleIndex.slice(0, limit)
  }

  const scored = visibleIndex.map((entry) => ({
    entry,
    score: scoreNavigationEntry(entry, tokens),
  }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)

  // Single-word queries that hit menu titles (e.g. "utilization") should not
  // flood results with every page whose description mentions the same word.
  if (tokens.length === 1) {
    const labelHits = scored.filter((row) => row.score >= LABEL_MATCH_MIN_SCORE)
    if (labelHits.length > 0) {
      return labelHits.slice(0, limit).map((row) => row.entry)
    }
  }

  return scored.slice(0, limit).map((row) => row.entry)
}

export function getNavigationEntryByHref(href: string): NavigationSearchEntry | undefined {
  return NAV_SEARCH_INDEX.find((entry) => entry.href === href)
}
