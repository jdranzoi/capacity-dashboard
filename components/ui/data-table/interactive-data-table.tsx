'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { ColumnFilterInput } from '@/components/ui/data-table/column-filter-input'
import { cn } from '@/lib/utils'
import {
  dashboardTableEmptyClass,
  dashboardTableShellClass,
} from '@/lib/ui/dashboard-surface'

const DEFAULT_PAGE_SIZE = 15

export type InteractiveDataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  getRowId: (row: T) => string
  initialSorting?: SortingState
  enablePagination?: boolean
  pageSize?: number
  emptyMessage?: string
  filteredEmptyMessage?: string
  /** e.g. "people in scope" — shown in the summary strip when rows exist. */
  scopeNoun?: string
  tableClassName?: string
  isRightAligned?: (columnId: string) => boolean
  wrapperClassName?: string
  /** When true, parent panel supplies the card shell — table body only. */
  embedded?: boolean
  footnote?: string | null
}

export function InteractiveDataTable<T>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  enablePagination = false,
  pageSize = DEFAULT_PAGE_SIZE,
  emptyMessage = 'No rows in scope.',
  filteredEmptyMessage = 'No rows match the column filters.',
  scopeNoun = 'rows',
  tableClassName = 'w-full min-w-xl border-collapse text-sm',
  isRightAligned = () => false,
  wrapperClassName,
  embedded = false,
  footnote,
}: InteractiveDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableMultiSort: true,
    autoResetPageIndex: true,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(enablePagination
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }
      : {}),
  })

  const leafColumns = table.getVisibleLeafColumns()
  const filteredCount = table.getFilteredRowModel().rows.length
  const totalInPayload = data.length
  const activeColumnFilters = columnFilters.some((f) => String(f.value ?? '').trim() !== '')

  if (data.length === 0) {
    return (
      <div className={cn(embedded ? 'p-0' : dashboardTableEmptyClass(), wrapperClassName)}>
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const pageCount = enablePagination ? table.getPageCount() : 1
  const pageIndex = table.getState().pagination?.pageIndex ?? 0

  return (
    <div
      className={cn(
        embedded ? undefined : dashboardTableShellClass(),
        wrapperClassName,
      )}
    >
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
              {scopeNoun} (column filters)
            </>
          ) : (
            <>
              <span className="tabular-nums text-foreground">
                {totalInPayload}
              </span>{" "}
              {scopeNoun}
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
        <table className={tableClassName}>
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
                    className={cn(
                      "overflow-hidden pb-2 pr-3 pt-1 align-middle",
                      right && "text-right",
                    )}
                  >
                    <div className={cn(right && "flex justify-end")}>
                      <ColumnFilterInput column={column} />
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
                  {filteredEmptyMessage}
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

      {enablePagination && filteredCount > 0 && pageCount > 1 ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 sm:px-4",
            embedded && "px-0",
          )}
        >
          <p className="text-[11px] tabular-nums text-muted-foreground">
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
