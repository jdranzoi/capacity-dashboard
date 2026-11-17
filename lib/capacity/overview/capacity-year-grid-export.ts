import type {
  CapacityYearGrid,
  CapacityYearGridRow,
  CapacityYearKpiKind,
} from '@/lib/capacity/overview/capacity-year-types'
import { fmtHeadcountKpi, fmtHoursKpi, fmtPct, roundDisplayStat } from '@/lib/overview/overview-metrics'

export function formatGridValue(kind: CapacityYearKpiKind, value: number | null): string {
  if (value == null) return '—'
  switch (kind) {
    case 'hours':
      return fmtHoursKpi(value)
    case 'pct':
      return fmtPct(value)
    case 'count':
      return fmtHeadcountKpi(value)
  }
}

const UNIT_SUFFIX: Record<CapacityYearKpiKind, string> = {
  hours: ' (h)',
  pct: ' (%)',
  count: '',
}

type ExportRow = { label: string; row: CapacityYearGridRow }

/** Rows as shown on screen: parents plus the breakdown rows of expanded parents. */
function visibleRows(grid: CapacityYearGrid, expanded: ReadonlySet<string>): ExportRow[] {
  return grid.rows.flatMap((row) => [
    { label: row.label, row },
    ...(row.breakdown && expanded.has(row.key)
      ? row.breakdown.rows.map((child) => ({ label: `${row.label} – ${child.label}`, row: child }))
      : []),
  ])
}

function headerCells(grid: CapacityYearGrid): string[] {
  return grid.columns.map((column) =>
    column.inProgress && column.kind === 'month' ? `${column.label} (MTD)` : column.label
  )
}

/** Spreadsheet cells: whole numbers without units (the unit is in the row label), blank when empty. */
function numericTable(grid: CapacityYearGrid, expanded: ReadonlySet<string>): string[][] {
  return [
    ['Metric', ...headerCells(grid)],
    ...visibleRows(grid, expanded).map(({ label, row }) => [
      `${label}${UNIT_SUFFIX[row.kind]}`,
      ...row.values.map((value) => (value == null ? '' : String(roundDisplayStat(value)))),
    ]),
  ]
}

/** Tab-separated: pastes into Excel or Google Sheets as cells. */
export function capacityYearGridToTsv(grid: CapacityYearGrid, expanded: ReadonlySet<string>): string {
  return numericTable(grid, expanded)
    .map((cells) => cells.join('\t'))
    .join('\n')
}

function csvCell(cell: string): string {
  return /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell
}

export function capacityYearGridToCsv(grid: CapacityYearGrid, expanded: ReadonlySet<string>): string {
  return numericTable(grid, expanded)
    .map((cells) => cells.map(csvCell).join(','))
    .join('\n')
}

export function capacityYearGridToMarkdown(
  grid: CapacityYearGrid,
  expanded: ReadonlySet<string>
): string {
  const header = ['Metric', ...headerCells(grid)]
  const lines = [
    `| ${header.join(' | ')} |`,
    `| --- | ${grid.columns.map(() => '---:').join(' | ')} |`,
    ...visibleRows(grid, expanded).map(
      ({ label, row }) =>
        `| ${label} | ${row.values.map((value) => formatGridValue(row.kind, value)).join(' | ')} |`
    ),
  ]
  return lines.join('\n')
}
