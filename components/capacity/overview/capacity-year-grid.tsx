'use client'

import { cva } from 'class-variance-authority'
import { Check, ChevronDown, ChevronRight, Copy, Download, Link2, Sheet } from 'lucide-react'
import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  capacityYearGridToCsv,
  capacityYearGridToHtml,
  capacityYearGridToJson,
  capacityYearGridToMarkdown,
  capacityYearGridToTsv,
  columnNote,
  formatGridValue,
} from '@/lib/capacity/overview/capacity-year-grid-export'
import type {
  CapacityYearGrid,
  CapacityYearGridColumn,
  CapacityYearGridRow,
} from '@/lib/capacity/overview/capacity-year-types'
import { DASHBOARD_SURFACE } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

const cellVariants = cva('px-2.5 py-2 text-right tabular-nums whitespace-nowrap', {
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
    plan: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [{ column: 'month', plan: true, className: 'text-muted-foreground' }],
  defaultVariants: { column: 'month', separated: false, plan: false },
})

const labelCellVariants = cva(
  'sticky left-0 z-10 truncate bg-card px-3 py-2 text-left font-normal whitespace-nowrap',
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

type ExportAction = 'markdown' | 'json' | 'csv' | 'sheets' | 'download'

/** Shift + Cmd (Ctrl elsewhere) + key, active while the export menu is open. */
const EXPORT_SHORTCUT_KEYS: Record<string, ExportAction> = {
  m: 'markdown',
  j: 'json',
  c: 'csv',
  g: 'sheets',
  d: 'download',
}

const EXPORT_ITEMS: { action: ExportAction; label: string; shortcut: string }[] = [
  { action: 'markdown', label: 'Copy as Markdown', shortcut: '⇧⌘M' },
  { action: 'json', label: 'Copy as JSON', shortcut: '⇧⌘J' },
  { action: 'csv', label: 'Copy as CSV', shortcut: '⇧⌘C' },
  { action: 'sheets', label: 'Copy for Google Sheets', shortcut: '⇧⌘G' },
  { action: 'download', label: 'Download CSV', shortcut: '⇧⌘D' },
]

function ExportItemIcon({ action }: { action: ExportAction }) {
  if (action === 'download') return <Download aria-hidden />
  if (action === 'sheets') return <Sheet aria-hidden />
  return <Copy aria-hidden />
}

function GridExportMenu({
  grid,
  expanded,
}: {
  grid: CapacityYearGrid
  expanded: ReadonlySet<string>
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (permissions / non-secure context)
    }
  }

  /** HTML table plus tab-separated text: Sheets and Excel paste either one as cells. */
  async function copyForSpreadsheet() {
    const tsv = capacityYearGridToTsv(grid, expanded)
    try {
      if (typeof ClipboardItem === 'undefined') throw new Error('ClipboardItem unavailable')
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([capacityYearGridToHtml(grid, expanded)], { type: 'text/html' }),
          'text/plain': new Blob([tsv], { type: 'text/plain' }),
        }),
      ])
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      await copy(tsv)
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

  function run(action: ExportAction) {
    setOpen(false)
    switch (action) {
      case 'markdown':
        return copy(capacityYearGridToMarkdown(grid, expanded))
      case 'json':
        return copy(capacityYearGridToJson(grid, expanded))
      case 'csv':
        return copy(capacityYearGridToCsv(grid, expanded))
      case 'sheets':
        return copyForSpreadsheet()
      case 'download':
        return downloadCsv()
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!event.shiftKey || !(event.metaKey || event.ctrlKey)) return
    const action = EXPORT_SHORTCUT_KEYS[event.key.toLowerCase()]
    if (!action) return
    event.preventDefault()
    void run(action)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" size="xs" data-slot="capacity-year-grid-export">
            {copied ? <Check aria-hidden /> : null}
            {copied ? 'Copied' : 'Export'}
            <ChevronDown aria-hidden className="text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent onKeyDown={onKeyDown}>
        {EXPORT_ITEMS.map((item) => (
          <DropdownMenuItem key={item.action} onClick={() => void run(item.action)}>
            <ExportItemIcon action={item.action} />
            {item.label}
            <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A month cell that opens another page for that month, only for months that page offers. */
type MonthLink = {
  months: ReadonlySet<string>
  href: (monthKey: string) => string
  page: string
}

function GridValueCells({
  row,
  columns,
  separators,
  monthLinks,
}: {
  row: CapacityYearGridRow
  columns: CapacityYearGridColumn[]
  separators: boolean[]
  monthLinks: Partial<Record<string, MonthLink>>
}) {
  const link = monthLinks[row.key]
  return row.values.map((value, i) => (
    <td
      key={columns[i].key}
      className={cn(
        cellVariants({
          column: columns[i].kind,
          separated: separators[i],
          plan: columns[i].plan,
        }),
        value == null && 'text-muted-foreground'
      )}
    >
      {link && value != null && columns[i].monthKey && link.months.has(columns[i].monthKey) ? (
        <a
          href={link.href(columns[i].monthKey)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${link.page} for ${columns[i].label} in a new tab`}
          className="group inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Link2
            aria-hidden
            className="size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
          />
          {formatGridValue(row.kind, value)}
        </a>
      ) : (
        formatGridValue(row.kind, value)
      )}
    </td>
  ))
}

/** Last month with plan data when the plan stops before December (the sync horizon). */
function planHorizonLabel(grid: CapacityYearGrid): string | null {
  const planMonths = grid.columns.filter((column) => column.kind === 'month' && column.plan)
  const last = planMonths[planMonths.length - 1]
  if (!last || last.key === 'm12') return null
  return `${last.label} ${grid.year}`
}

export function CapacityYearGridSection({
  grids,
  defaultYear,
  headcountLinkMonths,
  plannedLinkMonths,
  utilizationLinkMonths,
}: {
  grids: CapacityYearGrid[]
  defaultYear: number
  /** Months the Teams overview period picker offers (`YYYY-MM`); only these get a link. */
  headcountLinkMonths: string[]
  /** Months the Planning period picker offers (current month onward). */
  plannedLinkMonths: string[]
  /** Months the Utilization month picker offers (through the current month). */
  utilizationLinkMonths: string[]
}) {
  const monthLinks = useMemo<Partial<Record<string, MonthLink>>>(
    () => ({
      headcount: {
        months: new Set(headcountLinkMonths),
        href: (monthKey) => `/teams/overview?month=${monthKey}`,
        page: 'Teams overview',
      },
      plannedHours: {
        months: new Set(plannedLinkMonths),
        href: (monthKey) => `/capacity/planning?from=${monthKey}`,
        page: 'Planning',
      },
      utilizationPct: {
        months: new Set(utilizationLinkMonths),
        href: (monthKey) => `/capacity/utilization?month=${monthKey}`,
        page: 'Utilization',
      },
    }),
    [headcountLinkMonths, plannedLinkMonths, utilizationLinkMonths]
  )
  const [selectedYear, setSelectedYear] = useState(String(defaultYear))
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const grid = grids.find((g) => String(g.year) === selectedYear) ?? grids[0]
  if (!grid) return null

  const yearOptions = grids.map((g) => ({ value: String(g.year), label: String(g.year) }))
  const firstPctRow = grid.rows.findIndex((row) => row.kind === 'pct')
  const dividerRows = new Set([grid.rows.findIndex((row) => row.key === 'ptoHours'), firstPctRow])
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
            summed hours. Plan months show the latest snapshot&apos;s capacity, delivery plans and
            PTO; logged figures cover synced months only.
          </p>
          {/* Line kept for every year so switching tabs does not move the table. */}
          <p className="mt-0.5 min-h-4 text-[0.7rem] text-muted-foreground">
            {planHorizonLabel(grid)
              ? `Plan available through ${planHorizonLabel(grid)} (sync horizon).`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GridExportMenu grid={grid} expanded={expanded} />
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
        {/* Fixed layout and widths: the columns do not resize between years. */}
        <table
          className="w-full min-w-[98rem] table-fixed border-collapse text-xs"
          data-slot="capacity-year-grid-table"
        >
          <colgroup>
            <col className="w-52" />
            {grid.columns.map((column) => (
              <col key={column.key} className="w-20" />
            ))}
          </colgroup>
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
                  {/* Second line always present so the header height is the same for every year. */}
                  <span className="block min-h-4 text-[0.65rem] font-normal">
                    {columnNote(column)}
                  </span>
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
                      dividerRows.has(rowIndex) && 'border-t border-border'
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
                    <GridValueCells
                      row={row}
                      columns={grid.columns}
                      separators={separators}
                      monthLinks={monthLinks}
                    />
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
                            monthLinks={monthLinks}
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
