import type { LucideIcon } from 'lucide-react'

import { NAV_DOMAINS, NAV_OVERVIEW, NAV_ASK } from '@/lib/navigation/navigation-catalog'
import { isNavRouteShipped } from '@/lib/navigation/shipped-routes'
import type { SectionNavItem, SectionNavItemStatus } from '@/lib/navigation/section-nav-config'

export type SidebarNavItem = SectionNavItem

export type SidebarNavGroup = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  defaultHref: string
  items: SidebarNavItem[]
}

export const SIDEBAR_OVERVIEW = {
  label: NAV_OVERVIEW.label,
  href: NAV_OVERVIEW.href,
  description: NAV_OVERVIEW.description,
  icon: NAV_OVERVIEW.icon!,
} as const

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = NAV_DOMAINS.map((domain) => ({
  id: domain.id,
  label: domain.label,
  description: domain.description,
  icon: domain.icon,
  defaultHref: domain.defaultHref,
  items: domain.items,
}))

export const SIDEBAR_UTILITY = {
  label: NAV_ASK.label,
  href: NAV_ASK.href,
  description: NAV_ASK.description,
  icon: NAV_ASK.icon!,
} as const

/** Sidebar + ⌘K: disabled when no shipped dashboard exists for this href. */
export function isSidebarNavItemDisabled(
  href: string,
  status?: SectionNavItemStatus
): boolean {
  if (status === 'future') return true
  return !isNavRouteShipped(href)
}

/** Shipped routes only — unshipped catalog entries stay in config but are hidden in UI. */
export function isSidebarNavItemVisible(
  href: string,
  status?: SectionNavItemStatus
): boolean {
  return !isSidebarNavItemDisabled(href, status)
}

export function visibleSidebarItems(items: SidebarNavItem[]): SidebarNavItem[] {
  return items.filter((item) => isSidebarNavItemVisible(item.href, item.status))
}

export function visibleSidebarGroups(groups: SidebarNavGroup[]): SidebarNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: visibleSidebarItems(group.items),
      defaultHref:
        visibleSidebarItems(group.items).find((item) => isNavRouteShipped(item.href))?.href ??
        group.defaultHref,
    }))
    .filter((group) => group.items.length > 0)
}

/** Returns the domain group when the user is inside that section (Vercel drill-in). */
export function resolveActiveSidebarGroup(pathname: string): SidebarNavGroup | null {
  for (const group of SIDEBAR_NAV_GROUPS) {
    const prefix = `/${group.id}`
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const items = visibleSidebarItems(group.items)
      if (items.length === 0) return null
      return {
        ...group,
        items,
        defaultHref:
          items.find((item) => isNavRouteShipped(item.href))?.href ?? items[0]!.href,
      }
    }
  }
  return null
}
