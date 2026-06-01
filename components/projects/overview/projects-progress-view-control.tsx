'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { PlanningSegmentedControl } from '@/components/capacity/planning/planning-segmented-control'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { projectsOverviewHref } from '@/lib/projects/overview/projects-overview-nav'
import type { ProjectsViewMode } from '@/lib/projects/overview/projects-route-filters'

const VIEW_OPTIONS = [
  { value: 'global' as const, label: 'Global (All time)' },
  { value: 'monthly' as const, label: 'Monthly' },
]

export function ProjectsProgressViewControl({
  view,
  monthOptions,
  selectedMonthKey,
  monthLabel,
}: {
  view: ProjectsViewMode
  monthOptions: OverviewMonthOption[]
  selectedMonthKey: string
  monthLabel: string
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

  const monthlyLabel = useMemo(() => {
    const opt = monthOptions.find((o) => o.monthKey === selectedMonthKey)
    return opt?.label ?? monthLabel
  }, [monthLabel, monthOptions, selectedMonthKey])

  const viewOptions = useMemo(
    () =>
      VIEW_OPTIONS.map((o) =>
        o.value === 'monthly' ? { ...o, label: `Monthly (${monthlyLabel})` } : o
      ),
    [monthlyLabel]
  )

  return (
    <PlanningSegmentedControl
      label="View"
      value={view}
      onChange={(v) => navigate({ view: v })}
      options={viewOptions}
    />
  )
}
