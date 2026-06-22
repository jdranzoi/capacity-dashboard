'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ProjectsProgressChart } from '@/components/projects/overview/projects-progress-chart'
import { ProjectsProgressMonthControl } from '@/components/projects/overview/projects-progress-month-control'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { ProjectsCategoryFilter } from '@/lib/projects/overview/projects-route-filters'
import type { ProjectsOverviewPayload } from '@/lib/projects/overview/projects-types'

export function ProjectsOverviewGridBody({
  payload,
  category,
  showMonthPicker,
  monthOptions,
  selectedMonthKey,
}: {
  payload: ProjectsOverviewPayload
  category: ProjectsCategoryFilter
  showMonthPicker: boolean
  monthOptions: OverviewMonthOption[]
  selectedMonthKey: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedProjectKey = searchParams.get('project')?.trim() || null

  const chartTitle =
    category === 'build'
      ? 'Project progress (lifetime)'
      : payload.viewMode === 'monthly' && payload.monthLabel
        ? `Project progress (${payload.monthLabel})`
        : 'Project progress'

  const onSelectProject = useCallback(
    (projectKey: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('project', projectKey)
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex flex-col 3">
      <ProjectsProgressChart
        rows={payload.rows}
        selectedProjectKey={selectedProjectKey}
        onSelectProject={onSelectProject}
        chartTitle={chartTitle}
        headerAction={
          showMonthPicker ? (
            <ProjectsProgressMonthControl
              monthOptions={monthOptions}
              selectedMonthKey={selectedMonthKey}
            />
          ) : undefined
        }
      />

      <p className="text-[0.7rem] text-muted-foreground">{payload.footnote}</p>
    </div>
  );
}
