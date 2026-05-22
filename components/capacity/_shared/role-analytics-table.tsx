'use client'

import { useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { plannedPct } from '@/lib/domain/workload-metrics'
import {
  CAPACITY_FILL_KPI,
  PLANNED_KPI,
  UTILIZATION_KPI,
} from '@/lib/overview/capacity-kpi-contract'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import {
  filterNumberContains,
  filterPctContains,
  filterTextIncludesCi,
} from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type { RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'
import {
  utilizationLoggedVsCapacityBarStyles,
  utilizationLoggedVsCapacityCellStyle,
} from '@/lib/capacity/shared/utilization-tone'

const columnHelper = createColumnHelper<RoleAnalyticsRow>()

const RIGHT_ALIGNED = new Set([
  'netCapacityHours',
  'plannedHours',
  'plannedPct',
  'loggedHoursMtd',
  'capacityFillPct',
  'utilizationPct',
])

// Columns: ROLE | NET CAP | PLANNED | PLANNED % | LOGGED | CAPACITY FILL | UTIL + bar
const COLUMNS = [
  columnHelper.accessor('roleLabel', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
    cell: (info) => (
      <span className="block truncate font-medium text-foreground" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('netCapacityHours', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    header: ({ column }) => (
      <SortableHeader column={column} align="right">Net cap</SortableHeader>
    ),
    cell: (info) => (
      <span className="block truncate text-right tabular-nums">
        {fmtHoursKpi(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('plannedHours', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    header: ({ column }) => (
      <SortableHeader column={column} align="right">Planned</SortableHeader>
    ),
    cell: (info) => (
      <span className="block truncate text-right tabular-nums">
        {fmtHoursKpi(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor(
    (row) => plannedPct(row.plannedHours, row.netCapacityHours),
    {
      id: 'plannedPct',
      enableColumnFilter: true,
      filterFn: filterPctContains,
      sortingFn: (rowA, rowB, columnId) =>
        compareNullableNumber(
          rowA.getValue<number | null>(columnId),
          rowB.getValue<number | null>(columnId)
        ),
      header: ({ column }) => (
        <SortableHeader column={column} align="right" title={PLANNED_KPI.formulaFootnote}>
          {PLANNED_KPI.label}
        </SortableHeader>
      ),
      cell: (info) => (
        <span className="block truncate text-right tabular-nums">
          {fmtPct(info.getValue())}
        </span>
      ),
    }
  ),
  columnHelper.accessor('loggedHoursMtd', {
    enableColumnFilter: true,
    filterFn: filterNumberContains,
    header: ({ column }) => (
      <SortableHeader column={column} align="right">Logged</SortableHeader>
    ),
    cell: (info) => (
      <span className="block truncate text-right tabular-nums">
        {fmtHoursKpi(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('capacityFillPct', {
    enableColumnFilter: true,
    filterFn: filterPctContains,
    sortingFn: (rowA, rowB, columnId) =>
      compareNullableNumber(
        rowA.getValue<number | null>(columnId),
        rowB.getValue<number | null>(columnId)
      ),
    header: ({ column }) => (
      <SortableHeader column={column} align="right" title={CAPACITY_FILL_KPI.formulaFootnote}>
        {CAPACITY_FILL_KPI.label}
      </SortableHeader>
    ),
    cell: (info) => (
      <span className="block truncate text-right tabular-nums">
        {fmtPct(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('utilizationPct', {
    enableColumnFilter: true,
    filterFn: filterPctContains,
    sortingFn: (rowA, rowB, columnId) =>
      compareNullableNumber(
        rowA.getValue<number | null>(columnId),
        rowB.getValue<number | null>(columnId)
      ),
    header: ({ column }) => (
      <SortableHeader column={column} align="right" title={UTILIZATION_KPI.formulaFootnote}>
        {UTILIZATION_KPI.label}
      </SortableHeader>
    ),
    cell: (info) => {
      const v = info.getValue<number | null>()
      return (
        <span
          className="inline-block max-w-full min-w-14 truncate rounded-md px-2 py-0.5 text-right tabular-nums ring-1 ring-foreground/8"
          style={utilizationLoggedVsCapacityCellStyle(v)}
        >
          {fmtPct(v)}
        </span>
      )
    },
  }),
  columnHelper.display({
    id: 'utilBar',
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span className="sr-only">Utilization bar</span>,
    cell: ({ row }) => {
      const r = row.original
      return (
        <div
          className="h-2 w-full min-w-16 rounded-full bg-muted/50"
          title={
            [
              r.utilizationPct != null
                ? `${r.utilizationPct}% pace (mean per person)`
                : null,
              r.capacityFillPct != null
                ? `${r.capacityFillPct}% ${CAPACITY_FILL_KPI.label.toLowerCase()}`
                : null,
            ]
              .filter(Boolean)
              .join('. ') || undefined
          }
        >
          <div
            className="h-2 min-w-0 rounded-full"
            style={utilizationLoggedVsCapacityBarStyles(r.utilizationPct)}
          />
        </div>
      )
    },
  }),
] as ColumnDef<RoleAnalyticsRow, unknown>[]

export function RoleAnalyticsTable({
  rows,
  wrapperClassName,
}: {
  rows: RoleAnalyticsRow[]
  wrapperClassName?: string
}) {
  const columns = useMemo(() => COLUMNS, [])

  return (
    <InteractiveDataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.roleId ?? `unassigned-${r.roleKey}`}
      initialSorting={[{ id: 'roleLabel', desc: false }]}
      emptyMessage="No capacity rows in scope for this month."
      scopeNoun="roles in scope"
      embedded
      wrapperClassName={wrapperClassName}
      isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
    />
  )
}
