import { NAV_DOMAINS, type NavigationCatalogItem } from '@/lib/navigation/navigation-catalog'

export type SectionNavItemStatus = 'active' | 'coming-soon' | 'future'

export type SectionNavItem = NavigationCatalogItem

export type SectionId = 'capacity' | 'people' | 'teams' | 'projects'

export type SectionNavConfig = {
  id: SectionId
  label: string
  description: string
  basePath: string
  items: SectionNavItem[]
}

export const SECTION_NAV_CONFIG: Record<SectionId, SectionNavConfig> = Object.fromEntries(
  NAV_DOMAINS.map((domain) => [
    domain.id,
    {
      id: domain.id as SectionId,
      label: domain.label,
      description: domain.description,
      basePath: `/${domain.id}`,
      items: domain.items,
    },
  ])
) as Record<SectionId, SectionNavConfig>

export function getSectionNavConfig(sectionId: SectionId): SectionNavConfig {
  return SECTION_NAV_CONFIG[sectionId]
}

/** Exact match for section index routes that share a path prefix with siblings. */
export function isSectionNavItemActive(pathname: string, href: string): boolean {
  if (href === '/capacity/utilization') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
