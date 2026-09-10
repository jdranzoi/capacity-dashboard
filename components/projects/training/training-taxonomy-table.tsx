'use client'

import { useCallback, useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { DataSectionPanel, DataSectionPanelHeader } from '@/components/ui/data-section-panel'
import { useResolvedSectionRoutePending } from '@/components/ui/use-resolved-section-route-pending'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { filterNumberContains, filterTextIncludesCi } from '@/lib/table/table-filter-fns'
import type { TrainingTaxonomyRow } from '@/lib/projects/training/training-types'
import { TrainingMissingBadge } from '@/components/projects/training/training-missing-badge'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<TrainingTaxonomyRow>()

type TrainingTaxonomyParamKey = 'version' | 'component' | 'topic'

/** Narrower levels reset when a broader one changes, so the slice never goes empty. */
const NARROWER_PARAMS: Record<TrainingTaxonomyParamKey, string[]> = {
  version: ['component', 'topic'],
  component: ['topic'],
  topic: [],
}

const SCOPE_NOUN: Record<TrainingTaxonomyParamKey, string> = {
  version: 'versions',
  component: 'components',
  topic: 'topics',
}

const RIGHT_ALIGNED = new Set([
  'activityCount',
  'inProgressCount',
  'todoCount',
  'doneCount',
  'loggedHoursMonth',
])

function useTrainingParam(paramKey: TrainingTaxonomyParamKey) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pending = useResolvedSectionRoutePending()

  return useCallback(
    (key: string | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (!key) next.delete(paramKey)
      else next.set(paramKey, key)
      for (const narrower of NARROWER_PARAMS[paramKey]) next.delete(narrower)
      const query = next.toString()
      const href = query ? `${pathname}?${query}` : pathname
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [paramKey, pathname, pending, router, searchParams]
  )
}

export function TrainingTaxonomyTable({
  title,
  description,
  rows,
  paramKey,
  selectedKey,
}: {
  title: string
  description: string
  rows: TrainingTaxonomyRow[]
  paramKey: TrainingTaxonomyParamKey
  selectedKey: string | null
}) {
  const setParam = useTrainingParam(paramKey)

  const columns = useMemo(
    () => [
      columnHelper.accessor('label', {
        enableColumnFilter: true,
        filterFn: filterTextIncludesCi,
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: (info) => {
          const row = info.row.original
          const selected = selectedKey === row.key
          return (
            <button
              type="button"
              onClick={() => setParam(selected ? null : row.key)}
              aria-pressed={selected}
              className={cn(
                'text-left transition-colors',
                selected ? 'text-foreground underline underline-offset-4' : 'hover:text-foreground'
              )}
            >
              {row.isMissing ? <TrainingMissingBadge label={row.label} /> : (
                <span className="font-medium">{row.label}</span>
              )}
            </button>
          )
        },
      }),
      columnHelper.accessor('activityCount', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            Activities
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block text-right tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('inProgressCount', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            In progress
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block text-right tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('todoCount', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            To do
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block text-right tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('doneCount', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            Done
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block text-right tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('loggedHoursMonth', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            Logged
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
        ),
      }),
    ],
    [selectedKey, setParam]
  )

  return (
    <DataSectionPanel
      dataSlot={`training-taxonomy-${paramKey}`}
      className="h-112 min-h-0"
    >
      <div className="shrink-0 px-4 pt-4">
        <DataSectionPanelHeader
          title={title}
          description={
            selectedKey
              ? `${description} Click the selected name to clear.`
              : description
          }
        />
      </div>
      <InteractiveDataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.key}
        embedded
        stickyHeader
        wrapperClassName="flex min-h-0 flex-1 flex-col"
        bodyClassName="min-h-0 flex-1 overflow-y-auto"
        tableClassName="w-full min-w-80 border-collapse text-sm"
        scopeNoun={SCOPE_NOUN[paramKey]}
        emptyMessage="No values in this level."
        isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
        initialSorting={[{ id: 'activityCount', desc: true }]}
      />
    </DataSectionPanel>
  )
}
