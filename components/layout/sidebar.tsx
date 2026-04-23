'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-background px-3 py-4">
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Mira Commerce
        </p>
        <p className="text-sm font-medium">Capacity</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
