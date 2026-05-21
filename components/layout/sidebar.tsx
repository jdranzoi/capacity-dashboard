'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'

import { NavigationSearchTrigger } from '@/components/layout/navigation-command-menu'
import { useSidebar } from '@/components/layout/sidebar-context'
import { isSectionNavItemActive } from '@/lib/navigation/section-nav-config'
import {
  isSidebarNavItemDisabled,
  resolveActiveSidebarGroup,
  SIDEBAR_NAV_GROUPS,
  SIDEBAR_OVERVIEW,
  SIDEBAR_UTILITY,
  type SidebarNavGroup,
  type SidebarNavItem,
} from '@/lib/navigation/sidebar-nav-config'
import { cn } from '@/lib/utils'

const linkBase =
  'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors duration-150'

function isOverviewActive(pathname: string): boolean {
  return pathname === '/'
}

function isUtilityActive(pathname: string): boolean {
  return pathname === SIDEBAR_UTILITY.href || pathname.startsWith(`${SIDEBAR_UTILITY.href}/`)
}

function isRootGroupHighlighted(pathname: string, group: SidebarNavGroup): boolean {
  const prefix = `/${group.id}`
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('mb-3 flex items-center gap-2.5 px-1', collapsed && 'justify-center px-0')}>
      <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded bg-foreground text-[10px] font-bold tracking-tight text-background">
        M
      </div>
      <div
        className={cn(
          'overflow-hidden transition-[max-width,opacity] duration-180',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-50 opacity-100'
        )}
      >
        <p className="whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-widest text-muted-foreground">
          Mira Commerce
        </p>
        <p className="whitespace-nowrap text-sm font-semibold leading-tight">Workforce</p>
      </div>
    </div>
  )
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  trailing,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        linkBase,
        'w-full',
        collapsed && 'justify-center px-0',
        !collapsed && trailing && 'justify-between',
        active
          ? 'bg-sidebar-accent font-medium text-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      <span className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}>
        <Icon className="h-4 w-4 shrink-0" />
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-180',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-50 opacity-100'
          )}
        >
          {label}
        </span>
      </span>
      {!collapsed && trailing ? <span className="shrink-0">{trailing}</span> : null}
    </Link>
  )
}

/** Level 1 — compact root list (Vercel project settings home). */
function SidebarRootNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      <SidebarNavLink
        href={SIDEBAR_OVERVIEW.href}
        label={SIDEBAR_OVERVIEW.label}
        icon={SIDEBAR_OVERVIEW.icon}
        active={isOverviewActive(pathname)}
        collapsed={collapsed}
      />

      {SIDEBAR_NAV_GROUPS.map((group) => (
        <SidebarNavLink
          key={group.id}
          href={group.defaultHref}
          label={group.label}
          icon={group.icon}
          active={isRootGroupHighlighted(pathname, group)}
          collapsed={collapsed}
          trailing={
            !collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground/70" aria-hidden />
            ) : undefined
          }
        />
      ))}
    </nav>
  )
}

function SidebarSectionSubLink({
  item,
  collapsed,
}: {
  item: SidebarNavItem
  collapsed: boolean
}) {
  const pathname = usePathname()
  const active = isSectionNavItemActive(pathname, item.href)
  const disabled = isSidebarNavItemDisabled(item.status)

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled}
      title={collapsed ? `${item.label} — ${item.description}` : undefined}
      className={cn(
        'flex flex-col rounded-md px-2 py-1.5 transition-colors duration-150',
        collapsed && 'items-center px-0',
        active
          ? 'bg-sidebar-accent text-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
        disabled && 'pointer-events-none opacity-45'
      )}
    >
      <span
        className={cn(
          'text-sm leading-snug',
          active && 'font-medium',
          collapsed && 'sr-only'
        )}
      >
        {item.label}
      </span>
      {!collapsed ? (
        <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {item.description}
        </span>
      ) : null}
    </Link>
  )
}

/** Level 2 — drill-in panel with back control (Vercel section sub-nav). */
function SidebarSectionNav({
  group,
  collapsed,
}: {
  group: SidebarNavGroup
  collapsed: boolean
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label={`${group.label} sections`}>
      <div
        className={cn(
          'mb-2 flex items-center gap-1',
          collapsed ? 'justify-center px-0' : 'px-1'
        )}
        data-slot="sidebar-section-header"
      >
        <Link
          href="/"
          aria-label="Back to main navigation"
          title="Back"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {!collapsed ? (
          <span className="truncate text-sm font-semibold text-foreground">{group.label}</span>
        ) : (
          <Link
            href={group.defaultHref}
            title={group.label}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <group.icon className="h-4 w-4" />
          </Link>
        )}
      </div>

      {group.items.map((item) => (
        <SidebarSectionSubLink key={item.href} item={item} collapsed={collapsed} />
      ))}
    </nav>
  )
}

function SidebarUtilityFooter({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'mt-2 shrink-0 border-t border-sidebar-border pt-3',
        collapsed && 'flex flex-col items-center'
      )}
    >
      <nav className="flex w-full flex-col gap-0.5" aria-label="Utilities">
        <SidebarNavLink
          href={SIDEBAR_UTILITY.href}
          label={SIDEBAR_UTILITY.label}
          icon={SIDEBAR_UTILITY.icon}
          active={isUtilityActive(pathname)}
          collapsed={collapsed}
        />
      </nav>
    </div>
  )
}

function SidebarChrome({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('shrink-0', collapsed ? 'space-y-2 pb-2' : 'space-y-0 pb-3')}>
      <SidebarBrand collapsed={collapsed} />
      <div className={cn(collapsed && 'flex justify-center')}>
        <NavigationSearchTrigger collapsed={collapsed} />
      </div>
    </div>
  )
}

export function Sidebar() {
  const { collapsed } = useSidebar()
  const pathname = usePathname()
  const activeGroup = resolveActiveSidebarGroup(pathname)
  const showDrillIn = activeGroup !== null

  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-4 transition-[width] duration-180 ease-in-out"
    >
      <SidebarChrome collapsed={collapsed} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {showDrillIn && activeGroup ? (
          <SidebarSectionNav group={activeGroup} collapsed={collapsed} />
        ) : (
          <SidebarRootNav collapsed={collapsed} />
        )}
      </div>

      {!showDrillIn ? <SidebarUtilityFooter collapsed={collapsed} /> : null}
    </aside>
  )
}
