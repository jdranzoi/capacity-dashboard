'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { PlanningView } from '@/lib/capacity/planning/planning-types'
import { cn } from '@/lib/utils'

const TABS: { id: PlanningView; label: string }[] = [
  { id: 'people', label: 'People Planning' },
  { id: 'project', label: 'Project Planning' },
]

export function CapacityPlanningViewTabs({ activeView }: { activeView: PlanningView }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <nav
      className="flex gap-6 border-b border-border"
      aria-label="Planning perspective"
      data-slot="capacity-planning-tabs"
    >
      {TABS.map((tab) => {
        const p = new URLSearchParams(searchParams.toString())
        p.set('view', tab.id)
        const href = `${pathname}?${p.toString()}`
        const isActive = activeView === tab.id

        return (
          <Link
            key={tab.id}
            href={href}
            scroll={false}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium transition-colors',
              isActive
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
