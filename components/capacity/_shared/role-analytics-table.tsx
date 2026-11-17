'use client'

import { useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { plannedPct } from '@/lib/domain/workload-metrics'
import {
  CAPACITY_FILL_KPI,
  PLANNED_KPI,
  UTILIZATION_KPI,
} from '@/lib/domain/capacity-kpi-contract'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import {
  filterNumberContains,
  filterPctContains,
  filterTextIncludesCi,
} from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type { RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'
import { cn } from '@/lib/utils'
import {
  utilizationLoggedVsCapacityBarStyles,
  utilizationLoggedVsCapacityCellStyle,
} from '@/lib/capacity/shared/utilization-tone'

/** A role, or one of its people as a sub-row. */
type RoleTableRow = {
  id: string
  label: string
  netCapacityHours: number
  plannedHours: number
  loggedHoursMtd: number
  utilizationPct: number | null
  capacityFillPct: number | null
  subRows?: RoleTableRow[]
}

function toTableRows(rows: RoleAnalyticsRow[]): RoleTableRow[] {
  return rows.map((role) => {
    const id = role.roleId ?? `unassigned-${role.roleKey}`
    return {
      id,
      label: role.roleLabel,
      netCapacityHours: role.netCapacityHours,
      plannedHours: role.plannedHours,
      loggedHoursMtd: role.loggedHoursMtd,
      utilizationPct: role.utilizationPct,
      capacityFillPct: role.capacityFillPct,
      subRows: role.people.map((person) => ({
        id: `${id}:${person.personId}`,
        label: person.name,
        netCapacityHours: person.netCapacityHours,
        plannedHours: person.plannedHours,
        loggedHoursMtd: person.loggedHoursMtd,
        utilizationPct: person.utilizationPct,
        capacityFillPct: person.capacityFillPct,
      })),
    }
  })
}

const columnHelper = createColumnHelper<RoleTableRow>()

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
  columnHelper.accessor('label', {
    enableColumnFilter: true,
    filterFn: filterTextIncludesCi,
    header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
    cell: ({ row, getValue }) =>
      row.getCanExpand() ? (
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          className="-ml-1 flex max-w-full cursor-pointer items-center gap-1 rounded-sm pr-1 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          title={`${getValue()}: show people`}
        >
          <ChevronRight
            aria-hidden
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
              row.getIsExpanded() && 'rotate-90'
            )}
          />
          <span className="truncate">{getValue()}</span>
        </button>
      ) : (
        <span
          className={cn('block truncate', row.depth > 0 ? 'pl-5' : 'pl-3.5 font-medium text-foreground')}
          title={getValue()}
        >
          {getValue()}
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
                ? `${r.utilizationPct}% ${UTILIZATION_KPI.label.toLowerCase()}`
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
] as ColumnDef<RoleTableRow, unknown>[]

export function RoleAnalyticsTable({
  rows,
  wrapperClassName,
}: {
  rows: RoleAnalyticsRow[]
  wrapperClassName?: string
}) {
  const data = useMemo(() => toTableRows(rows), [rows])

  return (
    <InteractiveDataTable
      data={data}
      columns={COLUMNS}
      getRowId={(r) => r.id}
      getSubRows={(r) => r.subRows}
      initialSorting={[{ id: 'label', desc: false }]}
      emptyMessage="No capacity rows in scope for this month."
      scopeNoun="roles in scope"
      embedded
      wrapperClassName={wrapperClassName}
      isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
    />
  )
}
