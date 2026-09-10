import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { TrainingYearCompareYear, TrainingYearKpis } from '@/lib/projects/training-year/training-year-types'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

function formatSignedPct(value: number | null): string {
  if (value == null) return '—'
  const label = fmtPct(value)
  if (label === '—') return '—'
  return value > 0 ? `+${label}` : label
}

function TrainingYearKpiCard({
  label,
  periodHeader,
  currentYear,
  rows,
  formatPeriod,
  formatFull,
  deltaOf,
}: {
  label: string
  periodHeader: string
  currentYear: number
  rows: TrainingYearCompareYear[]
  formatPeriod: (row: TrainingYearCompareYear) => string
  formatFull: (row: TrainingYearCompareYear) => string
  deltaOf: (row: TrainingYearCompareYear) => number | null
}) {
  const ordered = [...rows].sort((a, b) => b.year - a.year)

  return (
    <div className={dashboardSurfaceClass('p-3')} data-slot="training-year-kpi-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
          {ordered.map((row) => {
            const isCurrent = row.year === currentYear
            return (
              <tr key={row.year} className="border-t border-border/45 first:border-0">
                <th
                  scope="row"
                  className={cn(
                    'py-1 text-left text-xs font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {row.year}
                </th>
                <td
                  className={cn(
                    'py-1 text-right text-xs tabular-nums',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {formatPeriod(row)}
                </td>
                <td className="py-1 text-right text-xs tabular-nums text-muted-foreground">
                  {formatFull(row)}
                </td>
                <td className="py-1 text-right text-[0.7rem] tabular-nums text-muted-foreground">
                  {isCurrent ? '—' : formatSignedPct(deltaOf(row))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function TrainingYearKpiRow({ kpis }: { kpis: TrainingYearKpis }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-slot="training-year-kpi-row">
      <TrainingYearKpiCard
        label="Hours"
        periodHeader={kpis.throughLabel}
        currentYear={kpis.currentYear}
        rows={kpis.years}
        formatPeriod={(row) => fmtHoursKpi(row.hours)}
        formatFull={(row) => (row.hoursFull == null ? '—' : fmtHoursKpi(row.hoursFull))}
        deltaOf={(row) => row.hoursDeltaPct}
      />
      <TrainingYearKpiCard
        label="Trainings"
        periodHeader={kpis.throughLabel}
        currentYear={kpis.currentYear}
        rows={kpis.years}
        formatPeriod={(row) => fmtHeadcountKpi(row.trainings)}
        formatFull={(row) => (row.trainingsFull == null ? '—' : fmtHeadcountKpi(row.trainingsFull))}
        deltaOf={(row) => row.trainingsDeltaPct}
      />
    </div>
  )
}
