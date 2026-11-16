'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control'
import type { ActivityProjectTypeFilter } from '@/lib/projects/activity/activity-types'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

export function ProjectsActivityToolbar({
  monthOptions,
  monthKey,
  typeFilter,
  typeOptions,
}: {
  monthOptions: OverviewMonthOption[]
  monthKey: string
  typeFilter: ActivityProjectTypeFilter
  typeOptions: SegmentedControlOption<ActivityProjectTypeFilter>[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pending = useProjectsRoutePending()

  const navigate = useCallback(
    (type: ActivityProjectTypeFilter) => {
      const next = new URLSearchParams(searchParams.toString())
      if (type === 'all') next.delete('type')
      else next.set('type', type)
      const href = next.toString() ? `${pathname}?${next.toString()}` : pathname
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [pathname, pending, router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-end justify-end gap-3">
      <DashboardFilterField label="Period">
        <OverviewMonthPicker options={monthOptions} selectedMonthKey={monthKey} />
      </DashboardFilterField>
      {typeOptions.length > 1 ? (
        <SegmentedControl
          label="Type"
          value={typeFilter}
          onChange={navigate}
          options={typeOptions}
        />
      ) : null}
    </div>
  )
}
