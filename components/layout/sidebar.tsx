'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/sidebar-context'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Briefcase,
  MessageSquare,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/flags', label: 'Flags', icon: AlertTriangle },
  { href: '/pipeline', label: 'Pipeline', icon: Briefcase },
  { href: '/ask', label: 'Ask', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed } = useSidebar()

  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-4 transition-[width] duration-180 ease-in-out"
    >
      {/* Brand */}
      <div className={cn('mb-6 flex items-center gap-2.5 px-1', collapsed && 'justify-center px-0')}>
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
          <p className="whitespace-nowrap text-sm font-semibold leading-tight">Capacity</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-180',
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-50 opacity-100'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
