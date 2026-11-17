import type {
  CapacityYearGrid,
  CapacityYearGridColumn,
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

type ExportRow = { label: string; row: CapacityYearGridRow; parent?: string }

/** Rows as shown on screen: parents plus the breakdown rows of expanded parents. */
function visibleRows(grid: CapacityYearGrid, expanded: ReadonlySet<string>): ExportRow[] {
  return grid.rows.flatMap((row) => [
    { label: row.label, row },
    ...(row.breakdown && expanded.has(row.key)
      ? row.breakdown.rows.map((child) => ({
          label: `${row.label} – ${child.label}`,
          row: child,
          parent: row.label,
        }))
      : []),
  ])
}

export function columnNote(column: CapacityYearGridColumn): string | null {
  if (column.kind === 'month') {
    if (column.plan) return 'Plan'
    return column.inProgress ? 'MTD' : null
  }
  return column.plan ? 'incl. plan' : null
}

function headerCells(grid: CapacityYearGrid): string[] {
  return grid.columns.map((column) => {
    const note = columnNote(column)
    return note ? `${column.label} (${note})` : column.label
  })
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

/** Tab-separated plain text: Google Sheets and Excel paste it as cells. */
export function capacityYearGridToTsv(grid: CapacityYearGrid, expanded: ReadonlySet<string>): string {
  return numericTable(grid, expanded)
    .map((cells) => cells.join('\t'))
    .join('\n')
}

function htmlCell(cell: string): string {
  return cell.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/** HTML table for the clipboard: spreadsheets keep the cells and read values as numbers. */
export function capacityYearGridToHtml(grid: CapacityYearGrid, expanded: ReadonlySet<string>): string {
  const [header, ...body] = numericTable(grid, expanded)
  const row = (cells: string[], tag: 'th' | 'td') =>
    `<tr>${cells.map((cell) => `<${tag}>${htmlCell(cell)}</${tag}>`).join('')}</tr>`
  return `<table><thead>${row(header, 'th')}</thead><tbody>${body
    .map((cells) => row(cells, 'td'))
    .join('')}</tbody></table>`
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

const JSON_UNIT: Record<CapacityYearKpiKind, 'hours' | 'percent' | 'people'> = {
  hours: 'hours',
  pct: 'percent',
  count: 'people',
}

/** Whole numbers keyed by column label; breakdown rows name their parent metric. */
export function capacityYearGridToJson(
  grid: CapacityYearGrid,
  expanded: ReadonlySet<string>
): string {
  const labels = headerCells(grid)
  const rows = visibleRows(grid, expanded).map(({ row, parent }) => ({
    metric: parent ?? row.label,
    ...(parent ? { breakdown: row.label } : {}),
    unit: JSON_UNIT[row.kind],
    values: Object.fromEntries(
      row.values.map((value, i) => [labels[i], value == null ? null : roundDisplayStat(value)])
    ),
  }))
  return JSON.stringify({ year: grid.year, rows }, null, 2)
}
