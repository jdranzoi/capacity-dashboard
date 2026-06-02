'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { formatProgressMonthToggleLabel } from '@/lib/projects/overview/projects-progress-month-options'
import { projectsOverviewHref } from '@/lib/projects/overview/projects-overview-nav'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function ProjectsProgressMonthControl({
  monthOptions,
  selectedMonthKey,
}: {
  monthOptions: OverviewMonthOption[]
  selectedMonthKey: string
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

  const controlOptions = useMemo(
    () =>
      monthOptions.map((o) => ({
        value: o.monthKey,
        label: formatProgressMonthToggleLabel(o.monthStartStr),
      })),
    [monthOptions]
  )

  if (controlOptions.length === 0) return null

  return (
    <SegmentedControl
      label="Month"
      value={selectedMonthKey}
      onChange={(monthKey) => navigate({ month: monthKey })}
      options={controlOptions}
    />
  )
}
