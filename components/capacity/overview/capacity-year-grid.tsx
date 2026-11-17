'use client'

import { cva } from 'class-variance-authority'
import { Check, ChevronRight, Copy, Download } from 'lucide-react'
import { Fragment, useState } from 'react'

import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  capacityYearGridToCsv,
  capacityYearGridToMarkdown,
  capacityYearGridToTsv,
  formatGridValue,
} from '@/lib/capacity/overview/capacity-year-grid-export'
import type {
  CapacityYearGrid,
  CapacityYearGridColumn,
  CapacityYearGridRow,
} from '@/lib/capacity/overview/capacity-year-types'
import { DASHBOARD_SURFACE } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

const cellVariants = cva('px-3 py-2 text-right tabular-nums whitespace-nowrap', {
  variants: {
    column: {
      month: '',
      quarter: 'bg-muted/30',
      year: 'bg-muted/50 font-medium text-foreground',
    },
    separated: {
      true: 'border-l border-border',
      false: '',
    },
  },
  defaultVariants: { column: 'month', separated: false },
})

const labelCellVariants = cva(
  'sticky left-0 z-10 bg-card px-3 py-2 text-left font-normal whitespace-nowrap',
  {
    variants: {
      level: {
        parent: 'text-foreground',
        child: 'pl-9 text-muted-foreground',
      },
    },
    defaultVariants: { level: 'parent' },
  }
)

/** A hairline before each quarter of months, before the quarter totals and before the year. */
function separatorsFor(columns: CapacityYearGridColumn[]): boolean[] {
  return columns.map((column, i) => {
    if (i === 0) return false
    if (column.kind !== columns[i - 1].kind) return true
    return column.kind === 'month' && i % 3 === 0
  })
}

type ExportFormat = 'excel' | 'markdown'

function GridExportActions({
  grid,
  expanded,
}: {
  grid: CapacityYearGrid
  expanded: ReadonlySet<string>
}) {
  const [copied, setCopied] = useState<ExportFormat | null>(null)

  async function copy(formatKey: ExportFormat) {
    const text =
      formatKey === 'excel'
        ? capacityYearGridToTsv(grid, expanded)
        : capacityYearGridToMarkdown(grid, expanded)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(formatKey)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard API unavailable (permissions / non-secure context)
    }
  }

  function downloadCsv() {
    const blob = new Blob([capacityYearGridToCsv(grid, expanded)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `capacity-overview-${grid.year}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyIcon = (formatKey: ExportFormat) =>
    copied === formatKey ? <Check aria-hidden /> : <Copy aria-hidden />

  return (
    <div className="flex items-center gap-1" data-slot="capacity-year-grid-export">
      <Button type="button" variant="ghost" size="xs" onClick={() => copy('excel')}>
        {copyIcon('excel')}
        {copied === 'excel' ? 'Copied' : 'Copy for Excel'}
      </Button>
      <Button type="button" variant="ghost" size="xs" onClick={() => copy('markdown')}>
        {copyIcon('markdown')}
        {copied === 'markdown' ? 'Copied' : 'Copy Markdown'}
      </Button>
      <Button type="button" variant="ghost" size="xs" onClick={downloadCsv}>
        <Download aria-hidden />
        CSV
      </Button>
    </div>
  )
}

function GridValueCells({
  row,
  columns,
  separators,
}: {
  row: CapacityYearGridRow
  columns: CapacityYearGridColumn[]
  separators: boolean[]
}) {
  return row.values.map((value, i) => (
    <td
      key={columns[i].key}
      className={cn(
        cellVariants({ column: columns[i].kind, separated: separators[i] }),
        value == null && 'text-muted-foreground'
      )}
    >
      {formatGridValue(row.kind, value)}
    </td>
  ))
}

export function CapacityYearGridSection({ grids }: { grids: CapacityYearGrid[] }) {
  const [selectedYear, setSelectedYear] = useState(String(grids[0]?.year ?? ''))
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const grid = grids.find((g) => String(g.year) === selectedYear) ?? grids[0]
  if (!grid) return null

  const yearOptions = grids.map((g) => ({ value: String(g.year), label: String(g.year) }))
  const firstPctRow = grid.rows.findIndex((row) => row.kind === 'pct')
  const separators = separatorsFor(grid.columns)

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section className="space-y-3" data-slot="capacity-year-grid">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Monthly breakdown
          </h2>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            Quarters and year: hours are totals, headcount is the monthly average, ratios use
            summed hours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GridExportActions grid={grid} expanded={expanded} />
          {yearOptions.length > 1 ? (
            <SegmentedControl
              label="Year"
              hideLabel
              value={String(grid.year)}
              onChange={setSelectedYear}
              options={yearOptions}
            />
          ) : null}
        </div>
      </div>

      <div className={cn(DASHBOARD_SURFACE, 'overflow-x-auto')}>
        <table className="w-full border-collapse text-xs" data-slot="capacity-year-grid-table">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className={cn(labelCellVariants(), 'font-medium')}>
                <span className="sr-only">Metric</span>
              </th>
              {grid.columns.map((column, i) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    cellVariants({ column: column.kind, separated: separators[i] }),
                    'font-medium'
                  )}
                >
                  <span className="block">{column.label}</span>
                  {column.inProgress && column.kind === 'month' ? (
                    <span className="block text-[0.65rem] font-normal">MTD</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, rowIndex) => {
              const isOpen = row.breakdown != null && expanded.has(row.key)
              return (
                <Fragment key={row.key}>
                  <tr
                    data-slot="capacity-year-grid-row"
                    className={cn(
                      'transition-colors hover:bg-muted/20',
                      rowIndex === firstPctRow && 'border-t border-border'
                    )}
                  >
                    <th scope="row" className={labelCellVariants()}>
                      {row.breakdown ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.key)}
                          aria-expanded={isOpen}
                          title={row.breakdown.label}
                          className="-ml-1 inline-flex cursor-pointer items-center gap-1 rounded-sm pr-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              'size-3.5 text-muted-foreground transition-transform duration-150',
                              isOpen && 'rotate-90'
                            )}
                          />
                          {row.label}
                          <span className="sr-only">, {row.breakdown.label}</span>
                        </button>
                      ) : (
                        <span className="pl-3.5">{row.label}</span>
                      )}
                    </th>
                    <GridValueCells row={row} columns={grid.columns} separators={separators} />
                  </tr>
                  {isOpen
                    ? row.breakdown!.rows.map((child) => (
                        <tr
                          key={child.key}
                          data-slot="capacity-year-grid-breakdown-row"
                          className="text-muted-foreground transition-colors hover:bg-muted/20"
                        >
                          <th scope="row" className={labelCellVariants({ level: 'child' })}>
                            {child.label}
                          </th>
                          <GridValueCells
                            row={child}
                            columns={grid.columns}
                            separators={separators}
                          />
                        </tr>
                      ))
                    : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
