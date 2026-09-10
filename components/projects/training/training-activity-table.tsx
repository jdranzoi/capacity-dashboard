'use client'

import { useMemo, useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { DataSectionPanel, DataSectionPanelHeader } from '@/components/ui/data-section-panel'
import { Badge } from '@/components/ui/badge'
import { MultiSelectFilter } from '@/components/ui/multi-select-filter'
import { TrainingMissingBadge } from '@/components/projects/training/training-missing-badge'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import {
  TRAINING_STATUS_BUCKET_LABEL,
  TRAINING_STATUS_BUCKET_ORDER,
} from '@/lib/projects/training/training-constants'
import {
  filterNumberContains,
  filterPctContains,
  filterTextIncludesCi,
} from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type {
  TrainingActivityRow,
  TrainingStatusBucket,
} from '@/lib/projects/training/training-types'

const columnHelper = createColumnHelper<TrainingActivityRow>()

const RIGHT_ALIGNED = new Set(['estimateHours', 'loggedHoursMonth', 'fillPct'])

function TaxonomyCell({ values, missingLabel }: { values: string[]; missingLabel: string }) {
  if (values.length === 0) return <TrainingMissingBadge label={missingLabel} />
  return (
    <span className="block truncate text-muted-foreground" title={values.join(', ')}>
      {values.join(', ')}
    </span>
  )
}

const COLUMNS = [
  columnHelper.accessor('issueKey', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Key</SortableHeader>,
    cell: (info) => (
      <a
        href={info.row.original.jiraUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-foreground underline-offset-2 hover:underline"
      >
        {info.getValue()}
        <span className="sr-only"> (opens in Jira)</span>
      </a>
    ),
  }),
  columnHelper.accessor('summary', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Activity</SortableHeader>,
    cell: (info) => (
      <span className="block truncate font-medium text-foreground" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('personName', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Person</SortableHeader>,
    cell: (info) =>
      info.getValue() ? (
        <span>{info.getValue()}</span>
      ) : (
        <TrainingMissingBadge label="Unassigned" />
      ),
  }),
  columnHelper.accessor('status', {
    enableColumnFilter: false,
    header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor((row) => row.fixVersions.join(', '), {
    id: 'fixVersions',
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Version</SortableHeader>,
    cell: (info) => (
      <TaxonomyCell values={info.row.original.fixVersions} missingLabel="No version" />
    ),
  }),
  columnHelper.accessor((row) => row.components.join(', '), {
    id: 'components',
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Area</SortableHeader>,
    cell: (info) => (
      <TaxonomyCell values={info.row.original.components} missingLabel="No area" />
    ),
  }),
  columnHelper.accessor((row) => row.labels.join(', '), {
    id: 'labels',
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Topic</SortableHeader>,
    cell: (info) => (
      <TaxonomyCell values={info.row.original.labels} missingLabel="No label" />
    ),
  }),
  columnHelper.accessor('estimateHours', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    sortingFn: (rowA, rowB, columnId) =>
      compareNullableNumber(
        rowA.getValue<number | null>(columnId),
        rowB.getValue<number | null>(columnId)
      ),
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        Estimate
      </SortableHeader>
    ),
    cell: (info) =>
      info.getValue() == null ? (
        <span className="block text-right">
          <TrainingMissingBadge label="No estimate" />
        </span>
      ) : (
        <span className="block text-right tabular-nums">{fmtHoursKpi(info.getValue() as number)}</span>
      ),
  }),
  columnHelper.accessor('loggedHoursMonth', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        Month
      </SortableHeader>
    ),
    cell: (info) => (
      <span className="block text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('fillPct', {
    enableColumnFilter: true,
    filterFn: filterPctContains,
    sortingFn: (rowA, rowB, columnId) =>
      compareNullableNumber(
        rowA.getValue<number | null>(columnId),
        rowB.getValue<number | null>(columnId)
      ),
    header: ({ column }) => (
      <SortableHeader column={column} align="right">
        vs est.
      </SortableHeader>
    ),
    cell: (info) => (
      <span className="block text-right tabular-nums">
        {info.getValue() == null ? '—' : fmtPct(info.getValue() as number)}
      </span>
    ),
  }),
]

export function TrainingActivityTable({ rows }: { rows: TrainingActivityRow[] }) {
  const columns = useMemo(() => COLUMNS, [])
  const [statusBuckets, setStatusBuckets] = useState<TrainingStatusBucket[]>([])

  const statusOptions = useMemo(() => {
    const present = new Set(rows.map((row) => row.statusBucket))
    return TRAINING_STATUS_BUCKET_ORDER.filter((bucket) => present.has(bucket)).map((bucket) => ({
      value: bucket,
      label: TRAINING_STATUS_BUCKET_LABEL[bucket],
    }))
  }, [rows])

  const visibleRows = useMemo(() => {
    if (statusBuckets.length === 0) return rows
    const selected = new Set(statusBuckets)
    return rows.filter((row) => selected.has(row.statusBucket))
  }, [rows, statusBuckets])

  return (
    <DataSectionPanel dataSlot="training-activity-table">
      <div className="relative z-20 px-4 pt-4">
        <DataSectionPanelHeader
          title="Activities"
          description="Child tickets. Fill % uses lifetime logged hours versus Original Estimate. Unestimated rows stay visible."
          aside={
            statusOptions.length > 0 ? (
              <MultiSelectFilter
                label="Status"
                ariaLabel="Filter activities by status"
                allLabel="All statuses"
                options={statusOptions}
                selected={statusBuckets}
                onChange={setStatusBuckets}
              />
            ) : null
          }
        />
      </div>
      <InteractiveDataTable
        data={visibleRows}
        columns={columns}
        getRowId={(row) => row.id}
        embedded
        enablePagination
        pageSize={20}
        scopeNoun="activities"
        emptyMessage={
          rows.length > 0
            ? 'No activities match the selected statuses.'
            : 'No training activities match the current filters.'
        }
        isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
        initialSorting={[{ id: 'issueKey', desc: true }]}
      />
    </DataSectionPanel>
  )
}
