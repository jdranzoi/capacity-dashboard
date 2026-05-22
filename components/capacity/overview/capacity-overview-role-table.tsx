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
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'

const columnHelper = createColumnHelper<TeamRoleAnalyticsRow>()

const RIGHT_ALIGNED = new Set([
  'headcount',
  'netCapacityHours',
  'plannedHours',
  'loggedHoursMtd',
  'capacityFillPct',
  'utilizationPct',
  'plannedPct',
])

export function CapacityOverviewRoleTable({ rows }: { rows: TeamRoleAnalyticsRow[] }) {
  const columns = useMemo(
    () =>
      [
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
        columnHelper.accessor('headcount', {
          enableColumnFilter: true,
          filterFn: filterNumberContains,
          header: ({ column }) => (
            <SortableHeader column={column} align="right">
              Headcount
            </SortableHeader>
          ),
          cell: (info) => (
            <span className="block truncate text-right tabular-nums">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor('netCapacityHours', {
          enableColumnFilter: true,
          filterFn: filterNumberContains,
          header: ({ column }) => (
            <SortableHeader column={column} align="right">
              Net cap
            </SortableHeader>
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
            <SortableHeader column={column} align="right">
              Planned
            </SortableHeader>
          ),
          cell: (info) => (
            <span className="block truncate text-right tabular-nums">
              {fmtHoursKpi(info.getValue())}
            </span>
          ),
        }),
        columnHelper.accessor('loggedHoursMtd', {
          enableColumnFilter: true,
          filterFn: filterNumberContains,
          header: ({ column }) => (
            <SortableHeader column={column} align="right">
              Logged
            </SortableHeader>
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
            <span className="block truncate text-right tabular-nums">{fmtPct(info.getValue())}</span>
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
          cell: (info) => (
            <span className="block truncate text-right tabular-nums">{fmtPct(info.getValue())}</span>
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
              <span className="block truncate text-right tabular-nums">{fmtPct(info.getValue())}</span>
            ),
          }
        ),
      ] as ColumnDef<TeamRoleAnalyticsRow, unknown>[],
    []
  )

  return (
    <InteractiveDataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.roleId ?? `unassigned-${r.roleKey}`}
      initialSorting={[{ id: 'netCapacityHours', desc: true }]}
      emptyMessage="No capacity rows in scope for this month."
      scopeNoun="roles in scope"
      embedded
      wrapperClassName="h-full"
      isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
    />
  )
}
