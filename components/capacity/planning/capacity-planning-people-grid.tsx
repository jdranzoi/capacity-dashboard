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

import { CapacityPlanningPeopleGridToolbar } from '@/components/capacity/planning/capacity-planning-people-grid-toolbar'
import {
  fmtPlanningHours,
  fmtPlanningPct,
  PLANNING_METRIC_CELL_CLASS,
  PLANNING_METRIC_COL_CLASS,
  PLANNING_NAME_CELL_CLASS,
  PLANNING_NAME_COL_CLASS,
  PlanningMetricCell,
  PlanningTreeNameCell,
} from '@/components/capacity/planning/planning-tree-grid-utils'
import { SortableHeader } from '@/components/ui/data-table/sortable-header'
import {
  filterPeopleTreeByUtilization,
  type PlanningTreeExpansion,
  type PlanningUtilizationBand,
} from '@/lib/capacity/planning/planning-grid-filters'
import {
  normalizeMonthVisibilityFilter,
  PLANNING_MONTH_VISIBILITY_ALL,
  resolveVisibleMonthKeys,
  type PlanningMonthVisibilityFilter,
} from '@/lib/capacity/planning/planning-month-visibility'
import type { PlanningPeopleNode } from '@/lib/capacity/planning/planning-types'
import { compareNullableNumber } from '@/lib/table/table-sort-utils'
import {
  dashboardTableEmptyClass,
  dashboardTableShellClass,
} from '@/lib/ui/dashboard-surface'
import type { StaffFilterMode } from '@/lib/ui/staff-filter-mode'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<PlanningPeopleNode>()

const METRIC_SUFFIXES = ['net', 'planned', 'open', 'util'] as const

function filterPeopleTreeRows(
  rows: PlanningPeopleNode[],
  mode: StaffFilterMode,
  roleValue: string,
  nameQuery: string
): PlanningPeopleNode[] {
  if (mode === 'role' && roleValue) {
    return rows.filter((row) => row.label === roleValue)
  }

  const q = nameQuery.trim().toLowerCase()
  if (mode === 'name' && q) {
    const out: PlanningPeopleNode[] = []
    for (const role of rows) {
      const people = (role.subRows ?? []).filter((p) => p.label.toLowerCase().includes(q))
      if (people.length > 0) out.push({ ...role, subRows: people })
    }
    return out
  }

  return rows
}

export function CapacityPlanningPeopleGrid({
  rows,
  monthKeys,
  monthLabels,
  roleOptions,
}: {
  rows: PlanningPeopleNode[]
  monthKeys: string[]
  monthLabels: Record<string, string>
  roleOptions: string[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [treeExpansion, setTreeExpansion] = useState<PlanningTreeExpansion>('collapse')
  const [filterMode, setFilterMode] = useState<StaffFilterMode>('role')
  const [roleFilter, setRoleFilter] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [utilBand, setUtilBand] = useState<PlanningUtilizationBand>('all')
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

  const filteredRows = useMemo(() => {
    const byRoleOrName = filterPeopleTreeRows(rows, filterMode, roleFilter, nameQuery)
    return filterPeopleTreeByUtilization(byRoleOrName, visibleMonthKeys, utilBand)
  }, [rows, filterMode, roleFilter, nameQuery, visibleMonthKeys, utilBand])

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

    const monthGroups = visibleMonthKeys.map((monthKey) =>
      columnHelper.group({
        id: monthKey,
        header: () => (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {monthLabels[monthKey] ?? monthKey}
          </span>
        ),
        columns: [
          columnHelper.accessor((row) => row.months[monthKey]?.netCapacityHours ?? null, {
            id: `${monthKey}_net`,
            sortingFn: (a, b) =>
              compareNullableNumber(
                a.original.months[monthKey]?.netCapacityHours ?? null,
                b.original.months[monthKey]?.netCapacityHours ?? null
              ),
            header: ({ column }) => (
              <SortableHeader column={column} align="right">
                Net
              </SortableHeader>
            ),
            cell: ({ row }) => (
              <PlanningMetricCell
                value={fmtPlanningHours(row.original.months[monthKey]?.netCapacityHours)}
              />
            ),
          }),
          columnHelper.accessor((row) => row.months[monthKey]?.plannedHours ?? null, {
            id: `${monthKey}_planned`,
            sortingFn: (a, b) =>
              compareNullableNumber(
                a.original.months[monthKey]?.plannedHours ?? null,
                b.original.months[monthKey]?.plannedHours ?? null
              ),
            header: ({ column }) => (
              <SortableHeader column={column} align="right">
                Plan
              </SortableHeader>
            ),
            cell: ({ row }) => (
              <PlanningMetricCell
                value={fmtPlanningHours(row.original.months[monthKey]?.plannedHours)}
              />
            ),
          }),
          columnHelper.accessor((row) => row.months[monthKey]?.openHours ?? null, {
            id: `${monthKey}_open`,
            sortingFn: (a, b) =>
              compareNullableNumber(
                a.original.months[monthKey]?.openHours ?? null,
                b.original.months[monthKey]?.openHours ?? null
              ),
            header: ({ column }) => (
              <SortableHeader column={column} align="right">
                Open
              </SortableHeader>
            ),
            cell: ({ row }) => {
              const openHours = row.original.months[monthKey]?.openHours ?? null
              return (
                <PlanningMetricCell
                  value={fmtPlanningHours(openHours)}
                  openHours={openHours}
                />
              )
            },
          }),
          columnHelper.accessor((row) => row.months[monthKey]?.utilizationPct ?? null, {
            id: `${monthKey}_util`,
            sortingFn: (a, b) =>
              compareNullableNumber(
                a.original.months[monthKey]?.utilizationPct ?? null,
                b.original.months[monthKey]?.utilizationPct ?? null
              ),
            header: ({ column }) => (
              <SortableHeader column={column} align="right">
                Util
              </SortableHeader>
            ),
            cell: ({ row }) => {
              const pct = row.original.months[monthKey]?.utilizationPct ?? null
              return <PlanningMetricCell value={fmtPlanningPct(pct)} tonePct={pct} />
            },
          }),
        ],
      })
    )

    return [nameCol, ...monthGroups]
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
      <CapacityPlanningPeopleGridToolbar
        mode={filterMode}
        onModeChange={setFilterMode}
        roleValue={roleFilter}
        onRoleChange={setRoleFilter}
        nameQuery={nameQuery}
        onNameQueryChange={setNameQuery}
        roleOptions={roleOptions}
        utilBand={utilBand}
        onUtilBandChange={setUtilBand}
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
              {table.getHeaderGroups().map((headerGroup, groupIndex) => (
                <tr key={headerGroup.id} className="border-b border-border/80">
                  {headerGroup.headers.map((header) => {
                    const isName = header.column.id === 'name'
                    const isMetric = METRIC_SUFFIXES.some((s) => header.column.id.endsWith(`_${s}`))
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'px-1 py-1.5 align-bottom font-normal',
                          groupIndex === 0 && !isName && 'text-center',
                          isName && PLANNING_NAME_COL_CLASS,
                          isMetric && PLANNING_METRIC_COL_CLASS
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
                    colSpan={table.getAllLeafColumns().length}
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
          Utilization bands use planned hours divided by net capacity for the selected period.
        </p>
      </div>
    </>
  )
}
