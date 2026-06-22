import { fmtHeadcountKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { cn } from '@/lib/utils'

const HEADCOUNT_BAR_GRID_CLASS =
  "grid gap-3 grid-cols-[minmax(11rem,34%)_minmax(0,1fr)]";

export type HeadcountBarChartRow = {
  id: string
  label: string
  headcount: number
  sharePct: number
}

function headcountAxisDomainMax(maxValue: number): number {
  if (maxValue <= 0) return 5
  return Math.max(5, Math.ceil(maxValue / 5) * 5)
}

export function HeadcountBarChart({
  rows,
  totalHeadcount,
  emptyMessage,
  ariaLabel,
}: {
  rows: HeadcountBarChartRow[]
  totalHeadcount: number
  emptyMessage: string
  ariaLabel: string
}) {
  const chartRows = [...rows]
    .filter((row) => row.headcount > 0)
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))

  if (chartRows.length === 0) {
    return <p className="mt-3 text-xs text-muted-foreground">{emptyMessage}</p>
  }

  const maxValue = chartRows.reduce((max, row) => Math.max(max, row.headcount), 0)
  const domainMax = headcountAxisDomainMax(maxValue)
  const tickStep = 5
  const ticks = Array.from({ length: domainMax / tickStep + 1 }, (_, i) => i * tickStep)

  return (
    <div className="mt-4">
      <ul className="list-none space-y-2.5 p-0" aria-label={ariaLabel}>
        {chartRows.map((row) => {
          const widthPct = domainMax > 0 ? Math.min(100, (row.headcount / domainMax) * 100) : 0
          const countLabel = fmtHeadcountKpi(row.headcount)
          const shareLabel = fmtPct(row.sharePct)
          const fullLabel = `${row.label}, ${countLabel} (${shareLabel} of ${fmtHeadcountKpi(totalHeadcount)})`

          return (
            <li key={row.id} className={HEADCOUNT_BAR_GRID_CLASS}>
              <div
                className="min-w-0 truncate text-sm leading-6 text-foreground"
                title={fullLabel}
              >
                <span className="font-medium">{row.label}</span>
                <span className="whitespace-nowrap font-normal tabular-nums text-muted-foreground">
                  {' '}
                  ({shareLabel})
                </span>
              </div>
              <div className="min-w-0">
                <div className="relative h-6 w-full overflow-hidden rounded-sm bg-muted/40 ring-1 ring-foreground/6">
                  <div
                    className="flex h-full min-w-6.5 items-center justify-end rounded-sm bg-team-headcount-bar pr-1.5"
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-[11px] font-medium tabular-nums text-team-headcount-bar-label">
                      {countLabel}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <div className={cn('mt-2', HEADCOUNT_BAR_GRID_CLASS)}>
        <div aria-hidden />
        <div className="flex justify-between border-t border-border/60 pt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick}>{fmtHeadcountKpi(tick)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
