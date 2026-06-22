'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { ColumnFilterInput } from '@/components/ui/data-table/column-filter-input'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import {
  dashboardTableEmptyClass,
  dashboardTableShellClass,
} from '@/lib/ui/dashboard-surface'
import {
  filterNumberContains,
  filterPctContains,
  filterTextIncludesCi,
} from '@/lib/table/table-filter-fns'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import type { UtilizationStaffingRow } from '@/lib/capacity/utilization/load-staffing-rows'
import { utilizationLoggedVsCapacityCellStyle } from '@/lib/capacity/shared/utilization-tone'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

/** Percent widths — `table-fixed`; totals 100% so pagination does not shift columns. */
const COLUMN_WIDTH_PCT: Record<string, string> = {
  roleLabel: '11%',
  personName: '12%',
  netCapacityHours: '9%',
  plannedHours: '9%',
  ptoHoursMonth: '7%',
  loggedHoursMtd: '9%',
  utilizationPct: '8%',
  billableEfficiencyPct: '8%',
  projects: '27%',
}

function colWidthStyle(columnId: string): CSSProperties | undefined {
  const w = COLUMN_WIDTH_PCT[columnId]
  return w ? { width: w, maxWidth: w } : undefined
}

const FILTER_ARIA_LABEL: Record<string, string> = {
  roleLabel: 'Filter rows by role label',
  personName: 'Filter rows by person name',
  netCapacityHours: 'Filter rows by net capacity hours',
  plannedHours: 'Filter rows by planned hours',
  ptoHoursMonth: 'Filter rows by PTO hours',
  loggedHoursMtd: 'Filter rows by logged hours',
  utilizationPct: 'Filter rows by utilization percent',
  billableEfficiencyPct: 'Filter rows by efficiency percent',
  projects: 'Filter rows by project keys',
}

/**
 * Client-side column filters only refine the `rows` payload (already scoped by URL/global
 * loaders). Changing month/filters on the page replaces `rows`; column filters apply on top.
 */
const columnHelper = createColumnHelper<UtilizationStaffingRow>()

export function UtilizationStaffingGrid({
  rows,
  footnote,
  embedded = false,
}: {
  rows: UtilizationStaffingRow[]
  /** Explains MTD vs calendar-month bounds for logged vs PTO. */
  footnote: string | null
  /** When true, renders table body only (parent supplies the panel shell). */
  embedded?: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'roleLabel', desc: false },
    { id: 'personName', desc: false },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => [
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
      columnHelper.accessor('personName', {
        enableColumnFilter: true,
        filterFn: filterTextIncludesCi,
        header: ({ column }) => (
          <SortableHeader column={column}>Person</SortableHeader>
        ),
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
            Net capacity
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block truncate text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
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
          <span className="block truncate text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('ptoHoursMonth', {
        enableColumnFilter: true,
        filterFn: filterNumberContains,
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            PTO
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block truncate text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
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
          <span className="block truncate text-right tabular-nums">{fmtHoursKpi(info.getValue())}</span>
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
            title="Logged MTD / (elapsed net weekdays × 8h). Zone holidays and weekday PTO through as-of."
          >
            Util.
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
      columnHelper.accessor('billableEfficiencyPct', {
        enableColumnFilter: true,
        filterFn: filterPctContains,
        sortingFn: (rowA, rowB, columnId) =>
          compareNullableNumber(
            rowA.getValue<number | null>(columnId),
            rowB.getValue<number | null>(columnId)
          ),
        header: ({ column }) => (
          <SortableHeader column={column} align="right" title="Efficiency (billable / logged)">
            Eff.
          </SortableHeader>
        ),
        cell: (info) => (
          <span className="block truncate text-right tabular-nums">{fmtPct(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          row.projects
            .map((p) => p.projectKey)
            .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
            .join(', '),
        {
          id: 'projects',
          enableColumnFilter: true,
          filterFn: filterTextIncludesCi,
          header: ({ column }) => (
            <SortableHeader column={column} title="Project keys with logged time (MTD)">
              Projects
            </SortableHeader>
          ),
          sortingFn: 'alphanumeric',
          cell: ({ row }) => {
            const refs = row.original.projects
            if (refs.length === 0) {
              return <span className="text-muted-foreground">—</span>
            }
            const keys = refs.map((p) => p.projectKey)
            const joined = keys.join(', ')
            return (
              <span className="block truncate text-muted-foreground" title={joined}>
                {joined}
              </span>
            )
          },
        }
      ),
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableMultiSort: true,
    autoResetPageIndex: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const leafColumns = table.getVisibleLeafColumns()
  const filteredRows = table.getFilteredRowModel().rows
  const filteredCount = filteredRows.length
  const totalInPayload = rows.length
  const activeColumnFilters = columnFilters.some((f) => String(f.value ?? '').trim() !== '')

  if (rows.length === 0) {
    return (
      <div className={embedded ? 'p-0' : dashboardTableEmptyClass()}>
        <p className="text-xs text-muted-foreground">
          No people with capacity in scope for this month.
        </p>
      </div>
    )
  }

  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex

  const isRightAligned = (id: string) =>
    id === 'netCapacityHours' ||
    id === 'plannedHours' ||
    id === 'ptoHoursMonth' ||
    id === 'loggedHoursMtd' ||
    id === 'utilizationPct' ||
    id === 'billableEfficiencyPct'

  return (
    <div className={embedded ? undefined : dashboardTableShellClass()}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4",
          embedded && "px-0",
        )}
      >
        <p className="text-[11px] text-muted-foreground">
          {activeColumnFilters ? (
            <>
              Showing{" "}
              <span className="tabular-nums text-foreground">
                {filteredCount}
              </span>{" "}
              of{" "}
              <span className="tabular-nums text-foreground">
                {totalInPayload}
              </span>{" "}
              in scope (column filters)
            </>
          ) : (
            <>
              <span className="tabular-nums text-foreground">
                {totalInPayload}
              </span>{" "}
              people in scope
            </>
          )}
        </p>
      </div>
      <div
        className={cn(
          "overflow-x-auto p-3 pt-2 sm:p-4 sm:pt-3",
          embedded && "px-0 pt-0",
        )}
      >
        <table className="w-full min-w-6xl table-fixed border-collapse text-sm">
          <colgroup>
            {leafColumns.map((col) => (
              <col key={col.id} style={colWidthStyle(col.id)} />
            ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-border text-left align-bottom text-muted-foreground"
              >
                {hg.headers.map((header) => {
                  const id = header.column.id;
                  const right = isRightAligned(id);
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={colWidthStyle(id)}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                      }
                      className={cn(
                        "overflow-hidden py-2 pr-3 align-bottom",
                        right && "text-right",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
            <tr className="border-b border-border bg-muted/15">
              {leafColumns.map((column) => {
                const id = column.id;
                const right = isRightAligned(id);
                return (
                  <th
                    key={`filter-${id}`}
                    scope="col"
                    style={colWidthStyle(id)}
                    className={cn(
                      "overflow-hidden pb-2 pr-3 pt-1 align-middle",
                      right && "text-right",
                    )}
                  >
                    <div className={cn(right && "flex justify-end")}>
                      <ColumnFilterInput
                        column={column}
                        ariaLabel={
                          FILTER_ARIA_LABEL[id] ?? `Filter column ${id}`
                        }
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredCount === 0 ? (
              <tr>
                <td
                  colSpan={leafColumns.length}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No rows match the column filters. Clear the filter inputs to
                  see everyone still in scope from the page filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => {
                    const id = cell.column.id;
                    const right = isRightAligned(id);
                    return (
                      <td
                        key={cell.id}
                        style={colWidthStyle(id)}
                        className={cn(
                          "overflow-hidden py-2 pr-3 align-middle",
                          right && "text-right",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredCount > 0 && pageCount > 1 ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 sm:px-4",
            embedded && "px-0",
          )}
        >
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Page {pageIndex + 1} of {pageCount}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {footnote ? (
        <p
          className={cn(
            "border-t border-border px-3 py-2 text-[10px] leading-snug text-muted-foreground sm:px-4",
            embedded && "px-0",
          )}
        >
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
