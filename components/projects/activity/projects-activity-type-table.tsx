'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createColumnHelper } from '@tanstack/react-table'
import { format, parse } from 'date-fns'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { filterNumberContains, filterTextIncludesCi } from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type { ProjectsActivityGroup, ProjectsActivityRow } from '@/lib/projects/activity/activity-types'

const columnHelper = createColumnHelper<ProjectsActivityRow>()

const RIGHT_ALIGNED = new Set(['loggedHours'])

function formatIsoDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parse(iso, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')
  } catch {
    return iso
  }
}

const COLUMNS = [
  columnHelper.accessor('projectKey', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Key</SortableHeader>,
    cell: (info) => (
      <span className="font-mono text-xs text-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('projectName', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
    cell: (info) => (
      <span className="block truncate font-medium text-foreground" title={info.getValue() ?? undefined}>
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
    cell: (info) => <span className="capitalize text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor('startDate', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Start</SortableHeader>,
    cell: (info) => (
      <span className="tabular-nums text-muted-foreground">{formatIsoDate(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('endDate', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>End</SortableHeader>,
    cell: (info) => (
      <span className="tabular-nums text-muted-foreground">{formatIsoDate(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('loggedHours', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    sortingFn: (a, b) => compareNullableNumber(a.original.loggedHours, b.original.loggedHours),
    header: ({ column }) => <SortableHeader column={column}>Logged</SortableHeader>,
    cell: (info) => <span className="tabular-nums">{fmtHoursKpi(info.getValue())}</span>,
  }),
]

export function ProjectsActivityTypeTable({
  group,
}: {
  group: ProjectsActivityGroup
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pending = useProjectsRoutePending()
  const selectedProjectKey = searchParams.get('project')?.trim() || null

  const onRowClick = useCallback(
    (row: ProjectsActivityRow) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('project', row.projectKey)
      const href = `${pathname}?${next.toString()}`
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [pathname, pending, router, searchParams]
  )

  return (
    <section className="space-y-2" data-slot={`projects-activity-${group.type}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
        <h2 className="text-sm font-medium tracking-tight text-foreground">{group.label}</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {group.rows.length}
        </span>
      </div>
      <InteractiveDataTable
        data={group.rows}
        columns={COLUMNS}
        getRowId={(row) => row.projectId}
        initialSorting={[{ id: 'loggedHours', desc: true }]}
        emptyMessage={`No ${group.label.toLowerCase()} projects with logged hours in this month.`}
        scopeNoun="projects"
        embedded
        stickyHeader
        isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
        onRowClick={onRowClick}
        isRowSelected={(row) => row.projectKey === selectedProjectKey}
      />
    </section>
  )
}
