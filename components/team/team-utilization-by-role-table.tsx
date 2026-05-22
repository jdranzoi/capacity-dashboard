'use client'

import { useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { InteractiveDataTable } from '@/components/ui/data-table/interactive-data-table'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { CAPACITY_FILL_KPI } from '@/lib/overview/capacity-kpi-contract'
import {
  filterNumberContains,
  filterPctContains,
  filterTextIncludesCi,
} from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'
import {
  utilizationLoggedVsCapacityBarStyles,
  utilizationLoggedVsCapacityCellStyle,
} from '@/lib/team/team-utilization-tone'

const columnHelper = createColumnHelper<TeamRoleAnalyticsRow>()

const RIGHT_ALIGNED = new Set([
  'netCapacityHours',
  'plannedHours',
  'loggedHoursMtd',
  'utilizationPct',
])

export function TeamUtilizationByRoleTable({ rows }: { rows: TeamRoleAnalyticsRow[] }) {
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
        columnHelper.accessor('utilizationPct', {
          enableColumnFilter: true,
          filterFn: filterPctContains,
          sortingFn: (rowA, rowB, columnId) =>
            compareNullableNumber(
              rowA.getValue<number | null>(columnId),
              rowB.getValue<number | null>(columnId)
            ),
          header: ({ column }) => (
            <SortableHeader
              column={column}
              align="right"
              title="Mean per-person pace: logged MTD / (elapsed net weekdays × 8h)"
            >
              Util
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
                  [r.utilizationPct != null ? `${r.utilizationPct}% pace (mean per person)` : null,
                    r.capacityFillPct != null
                      ? `${r.capacityFillPct}% ${CAPACITY_FILL_KPI.label.toLowerCase()}`
                      : null]
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
      ] as ColumnDef<TeamRoleAnalyticsRow, unknown>[],
    []
  )

  return (
    <InteractiveDataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.roleId ?? `unassigned-${r.roleKey}`}
      initialSorting={[{ id: 'roleLabel', desc: false }]}
      emptyMessage="No capacity rows in scope for this month."
      scopeNoun="roles in scope"
      embedded
      wrapperClassName="mt-3"
      isRightAligned={(id) => RIGHT_ALIGNED.has(id)}
    />
  )
}
