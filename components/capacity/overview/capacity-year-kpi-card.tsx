import { CapacityYearLineChart } from '@/components/capacity/overview/capacity-year-line-chart'
import { CapacityYearStackChart } from '@/components/capacity/overview/capacity-year-stack-chart'
import type { CapacityYearKpiCard as CapacityYearKpiCardData } from '@/lib/capacity/overview/capacity-year-types'
import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import { yearCompareColorVar } from '@/lib/ui/year-compare-colors'
import { cn } from '@/lib/utils'

function formatSignedPct(value: number | null): string {
  if (value == null) return '—'
  const label = fmtPct(value)
  if (label === '—') return '—'
  return value > 0 ? `+${label}` : label
}

function formatValue(
  kind: CapacityYearKpiCardData['kind'],
  value: number | null
): string {
  if (value == null) return '—'
  if (kind === 'pct') return fmtPct(value)
  if (kind === 'count') return fmtHeadcountKpi(value)
  return fmtHoursKpi(value)
}

export function CapacityYearKpiCard({
  card,
  currentYear,
  throughMonthIndex,
  periodHeader,
}: {
  card: CapacityYearKpiCardData
  currentYear: number
  throughMonthIndex: number
  periodHeader: string
}) {
  return (
    <div className={dashboardSurfaceClass('flex h-full flex-col p-3')} data-slot="capacity-year-kpi-card">
      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr className="text-[0.65rem] text-muted-foreground">
            <th className="pb-1.5 text-left font-medium">Year</th>
            <th className="pb-1.5 text-right font-medium">{periodHeader}</th>
            <th className="pb-1.5 text-right font-medium">Full year</th>
            <th className="pb-1.5 text-right font-medium">{currentYear} vs</th>
          </tr>
        </thead>
        <tbody>
          {card.years.map((row) => {
            const isCurrent = row.year === currentYear
            return (
              <tr key={row.year} className="border-t border-border/45 first:border-0">
                <th
                  scope="row"
                  className="py-1 text-left text-xs font-medium"
                  style={{ color: yearCompareColorVar(row.year, currentYear) }}
                >
                  {row.year}
                </th>
                <td
                  className={cn(
                    'py-1 text-right text-xs tabular-nums',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {formatValue(card.kind, row.period)}
                </td>
                <td className="py-1 text-right text-xs tabular-nums text-muted-foreground">
                  {formatValue(card.kind, row.full)}
                </td>
                <td className="py-1 text-right text-[0.7rem] tabular-nums text-muted-foreground">
                  {isCurrent ? '—' : formatSignedPct(row.deltaPct)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <CapacityYearLineChart
        series={card.series}
        currentYear={currentYear}
        kind={card.kind}
        label={card.label}
        yFocus={
          card.key === 'utilizationPct'
            ? { min: 60, max: 80 }
            : card.key === 'commercialUtilizationPct'
              ? { min: 40, max: 80 }
              : undefined
        }
      />
      {card.stacks && card.stacks.length > 0 ? (
        <CapacityYearStackChart
          layers={card.stacks}
          throughMonthIndex={throughMonthIndex}
          label={`${card.label} mix`}
          caption={`${currentYear} mix`}
          compact
        />
      ) : null}
    </div>
  )
}
