'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { PlanningSegmentedControl } from '@/components/capacity/planning/planning-segmented-control'
import { PROJECTS_OVERVIEW_TYPE_OPTIONS } from '@/lib/projects/overview/projects-overview-constants'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { projectsOverviewHref } from '@/lib/projects/overview/projects-overview-nav'
import type { ProjectsCategoryFilter } from '@/lib/projects/overview/projects-route-filters'
import { cn } from '@/lib/utils'

export function ProjectsOverviewToolbar({
  category,
  searchQuery,
}: {
  category: ProjectsCategoryFilter
  searchQuery: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pending = useProjectsRoutePending()

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const href = projectsOverviewHref(pathname, searchParams, updates)
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [pathname, pending, router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-end justify-end gap-3">
      <PlanningSegmentedControl
        label="Project type"
        value={category}
        onChange={(v) => navigate({ category: v })}
        options={PROJECTS_OVERVIEW_TYPE_OPTIONS}
      />

      <DashboardFilterField label="Search">
        <input
          type="search"
          defaultValue={searchQuery ?? ''}
          placeholder="Search projects…"
          className={cn(
            'h-8 w-full min-w-[12rem] max-w-xs rounded-lg border border-border bg-background px-2.5 text-xs',
            'text-foreground placeholder:text-muted-foreground outline-none',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
          )}
          aria-label="Search projects by name or key"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            const value = (e.target as HTMLInputElement).value.trim()
            navigate({ q: value || null })
          }}
          onBlur={(e) => {
            const value = e.target.value.trim()
            const current = searchQuery ?? ''
            if (value === current) return
            navigate({ q: value || null })
          }}
        />
      </DashboardFilterField>
    </div>
  )
}
