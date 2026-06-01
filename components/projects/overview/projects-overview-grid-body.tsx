'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ProjectsProgressChart } from '@/components/projects/overview/projects-progress-chart'
import { ProjectsProgressViewControl } from '@/components/projects/overview/projects-progress-view-control'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { ProjectsViewMode } from '@/lib/projects/overview/projects-route-filters'
import type { ProjectsOverviewPayload } from '@/lib/projects/overview/projects-types'

export function ProjectsOverviewGridBody({
  payload,
  view,
  monthOptions,
  selectedMonthKey,
  monthLabel,
}: {
  payload: ProjectsOverviewPayload
  view: ProjectsViewMode
  monthOptions: OverviewMonthOption[]
  selectedMonthKey: string
  monthLabel: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedProjectKey = searchParams.get('project')?.trim() || null

  const chartTitle =
    payload.viewMode === 'monthly' && payload.monthLabel
      ? `Project progress (${payload.monthLabel})`
      : 'Project progress (lifetime)'

  const onSelectProject = useCallback(
    (projectKey: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('project', projectKey)
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex flex-col gap-4">
      <ProjectsProgressChart
        rows={payload.rows}
        selectedProjectKey={selectedProjectKey}
        onSelectProject={onSelectProject}
        chartTitle={chartTitle}
        headerAction={
          <ProjectsProgressViewControl
            view={view}
            monthOptions={monthOptions}
            selectedMonthKey={selectedMonthKey}
            monthLabel={monthLabel}
          />
        }
      />

      <p className="text-[0.7rem] text-muted-foreground">{payload.footnote}</p>
    </div>
  )
}
