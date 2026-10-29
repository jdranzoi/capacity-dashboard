'use client'

import { Suspense, use, useEffect, useState } from 'react'

import { ProjectTeamRoleHours } from '@/components/projects/overview/project-team-role-hours'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  ProjectDetailTeamPayload,
  ProjectExecutionScope,
} from '@/lib/projects/overview/projects-types'
import { cn } from '@/lib/utils'

const teamPromises = new Map<
  string,
  Promise<{ data: ProjectDetailTeamPayload | null; error: string | null }>
>()

function teamCacheKey(
  projectKey: string,
  monthKey: string | null,
  scope: ProjectExecutionScope
): string {
  return `${projectKey}::${monthKey ?? ''}::${scope}`
}

function getProjectDetailTeamPromise(
  projectKey: string,
  monthKey: string | null,
  scope: ProjectExecutionScope
) {
  const key = teamCacheKey(projectKey, monthKey, scope)
  let promise = teamPromises.get(key)
  if (!promise) {
    const params = new URLSearchParams({ project: projectKey, scope })
    if (monthKey) params.set('month', monthKey)
    promise = fetch(`/api/projects/detail-team?${params.toString()}`, {
      cache: 'no-store',
    }).then(async (response) => {
      const payload = (await response.json()) as {
        data?: ProjectDetailTeamPayload | null
        error?: string
      }
      if (!response.ok) {
        return { data: null, error: payload.error ?? 'Could not load team hours' }
      }
      return { data: payload.data ?? null, error: payload.error ?? null }
    })
    teamPromises.set(key, promise)
  }
  return promise
}

export function ProjectDetailTeamTabSkeleton() {
  return (
    <div className="space-y-3" data-slot="projects-detail-team-skeleton">
      <Skeleton className="h-3 w-40" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-1.5 py-3">
          <div className="grid grid-cols-[minmax(0,11rem)_3.25rem_3.25rem_minmax(12rem,1fr)] items-center gap-x-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className={cn('space-y-1 pl-3')}>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjectDetailTeamTab({
  projectKey,
  monthKey,
  monthLabel,
  defaultScope,
}: {
  projectKey: string
  monthKey: string | null
  monthLabel: string | null
  defaultScope: ProjectExecutionScope
}) {
  const [scope, setScope] = useState<ProjectExecutionScope>(defaultScope)

  useEffect(() => {
    setScope(defaultScope)
  }, [projectKey, defaultScope])

  const monthOptionLabel = monthLabel ?? 'Month'

  return (
    <section className="space-y-3" data-slot="projects-detail-team">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.7rem] font-medium text-foreground">
            Hours by role
          </h3>
          <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
            Planned and logged by role and person
          </p>
        </div>
        <SegmentedControl
          label="Hours window"
          hideLabel
          value={scope}
          onChange={setScope}
          options={[
            { value: 'month', label: monthOptionLabel },
            { value: 'lifetime', label: 'Lifetime' },
          ]}
        />
      </div>
      <Suspense
        key={teamCacheKey(projectKey, monthKey, scope)}
        fallback={<ProjectDetailTeamTabSkeleton />}
      >
        <ProjectDetailTeamTabBody
          projectKey={projectKey}
          monthKey={monthKey}
          scope={scope}
        />
      </Suspense>
    </section>
  )
}

function ProjectDetailTeamTabBody({
  projectKey,
  monthKey,
  scope,
}: {
  projectKey: string
  monthKey: string | null
  scope: ProjectExecutionScope
}) {
  const result = use(getProjectDetailTeamPromise(projectKey, monthKey, scope))

  if (result.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load team hours: {result.error}
      </p>
    )
  }

  const payload = result.data
  if (!payload || payload.roles.length === 0) {
    return <p className="text-xs text-muted-foreground">No planned or logged hours for this team.</p>
  }

  return (
    <ProjectTeamRoleHours
      roles={payload.roles}
      ariaLabel="Planned and logged hours by role and person"
    />
  )
}
