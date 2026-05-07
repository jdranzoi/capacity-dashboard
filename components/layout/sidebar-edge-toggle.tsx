'use client'

import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/sidebar-context'

export function SidebarEdgeToggle() {
  const { collapsed, toggle } = useSidebar()

  return (
    <button
      onClick={toggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        left: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
        transform: 'translateX(-50%)',
        transition: 'left 180ms ease-in-out',
      }}
      className="absolute top-16 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
    >
      <ChevronLeft
        className={cn('h-3 w-3 transition-transform duration-180', collapsed && 'rotate-180')}
      />
    </button>
  )
}
