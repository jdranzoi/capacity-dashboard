'use client'

import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type ExpandedState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

import { CapacityPlanningProjectGridToolbar } from '@/components/capacity/planning/capacity-planning-project-grid-toolbar'
import {
  fmtPlanningHours,
  PLANNING_METRIC_CELL_CLASS,
  PLANNING_METRIC_COL_CLASS,
  PLANNING_NAME_CELL_CLASS,
  PLANNING_NAME_COL_CLASS,
  PlanningMetricCell,
  PlanningTreeNameCell,
} from '@/components/capacity/planning/planning-tree-grid-utils'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import {
  filterProjectTreeByType,
  type PlanningProjectTypeFilter,
  type PlanningTreeExpansion,
} from '@/lib/capacity/planning/planning-grid-filters'
import {
  normalizeMonthVisibilityFilter,
  PLANNING_MONTH_VISIBILITY_ALL,
  resolveVisibleMonthKeys,
  type PlanningMonthVisibilityFilter,
} from '@/lib/capacity/planning/planning-month-visibility'
import type { PlanningProjectNode } from '@/lib/capacity/planning/planning-types'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import {
  dashboardTableEmptyClass,
  dashboardTableShellClass,
} from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<PlanningProjectNode>()

export function CapacityPlanningProjectGrid({
  rows,
  monthKeys,
  monthLabels,
}: {
  rows: PlanningProjectNode[]
  monthKeys: string[]
  monthLabels: Record<string, string>
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [treeExpansion, setTreeExpansion] = useState<PlanningTreeExpansion>('collapse')
  const [projectType, setProjectType] = useState<PlanningProjectTypeFilter>('all')
  const [monthVisibility, setMonthVisibility] = useState<PlanningMonthVisibilityFilter>(
    PLANNING_MONTH_VISIBILITY_ALL
  )

  const activeMonthVisibility = useMemo(
    () => normalizeMonthVisibilityFilter(monthKeys, monthVisibility),
    [monthKeys, monthVisibility]
  )

  const visibleMonthKeys = useMemo(
    () => resolveVisibleMonthKeys(monthKeys, activeMonthVisibility),
    [monthKeys, activeMonthVisibility]
  )

  const handleTreeExpansionChange = (value: PlanningTreeExpansion) => {
    setTreeExpansion(value)
    setExpanded(value === 'expand' ? true : {})
  }

  const filteredRows = useMemo(
    () => filterProjectTreeByType(rows, projectType),
    [rows, projectType]
  )

  const columns = useMemo(() => {
    const nameCol = columnHelper.accessor('label', {
      id: 'name',
      header: ({ column }) => (
        <SortableHeader column={column} align="left">
          Name
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <PlanningTreeNameCell
          label={row.original.label}
          depth={row.depth}
          kind={row.original.kind}
          canExpand={row.getCanExpand()}
          isExpanded={row.getIsExpanded()}
          onToggle={row.getToggleExpandedHandler()}
        />
      ),
    })

    const monthCols = visibleMonthKeys.map((monthKey) =>
      columnHelper.accessor((row) => row.months[monthKey]?.plannedHours ?? null, {
        id: monthKey,
        sortingFn: (a, b) =>
          compareNullableNumber(
            a.original.months[monthKey]?.plannedHours ?? null,
            b.original.months[monthKey]?.plannedHours ?? null
          ),
        header: ({ column }) => (
          <SortableHeader column={column} align="right">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {monthLabels[monthKey] ?? monthKey}
            </span>
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <PlanningMetricCell
            value={fmtPlanningHours(row.original.months[monthKey]?.plannedHours)}
          />
        ),
      })
    )

    return [nameCol, ...monthCols]
  }, [visibleMonthKeys, monthLabels])

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  })

  const visibleRows = table.getRowModel().rows
  const filteredEmpty = rows.length > 0 && visibleRows.length === 0

  return (
    <>
      <CapacityPlanningProjectGridToolbar
        projectType={projectType}
        onProjectTypeChange={setProjectType}
        monthKeys={monthKeys}
        monthLabels={monthLabels}
        monthVisibility={activeMonthVisibility}
        onMonthVisibilityChange={setMonthVisibility}
        treeExpansion={treeExpansion}
        onTreeExpansionChange={handleTreeExpansionChange}
      />
      <div className={dashboardTableShellClass('overflow-hidden rounded-none border-0 ring-0')}>
        <div className="max-h-[min(36rem,70vh)] overflow-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_var(--border)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border/80">
                  {headerGroup.headers.map((header) => {
                    const isName = header.column.id === 'name'
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-1.5 py-1.5 align-bottom font-normal',
                          isName ? PLANNING_NAME_COL_CLASS : cn(PLANNING_METRIC_COL_CLASS, 'text-right')
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn(
                      dashboardTableEmptyClass('text-center text-sm'),
                      'border-0 shadow-none ring-0'
                    )}
                  >
                    {filteredEmpty ? 'No rows match the filter.' : 'No planning rows in scope.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/20"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          cell.column.id === 'name' ? PLANNING_NAME_CELL_CLASS : PLANNING_METRIC_CELL_CLASS
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          Expand projects to see roles and people. Values are planned hours per month.
        </p>
      </div>
    </>
  )
}
