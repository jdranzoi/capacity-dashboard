import type { LucideIcon } from 'lucide-react'

import { NAV_DOMAINS, NAV_OVERVIEW, NAV_ASK } from '@/lib/navigation/navigation-catalog'
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

export function isSidebarNavItemDisabled(status?: SectionNavItemStatus): boolean {
  return status === 'future'
}

/** Returns the domain group when the user is inside that section (Vercel drill-in). */
export function resolveActiveSidebarGroup(pathname: string): SidebarNavGroup | null {
  for (const group of SIDEBAR_NAV_GROUPS) {
    const prefix = `/${group.id}`
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return group
    }
  }
  return null
}
