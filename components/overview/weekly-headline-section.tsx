import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

const METRICS = [
  { key: 'netCapacityHours' as const, label: 'Net capacity', worklog: false },
  { key: 'plannedHours' as const, label: 'Planned', worklog: false },
  { key: 'availabilityHours' as const, label: 'Remaining capacity', worklog: false },
  { key: 'ptoHours' as const, label: 'PTO', worklog: true },
  { key: 'billableHours' as const, label: 'Billable', worklog: true },
  { key: 'loggedHours' as const, label: 'Logged', worklog: true },
]

type MetricKey = (typeof METRICS)[number]['key']

function fmt(n: number): string {
  return n === 0 ? '—' : `${n}h`
}

export function WeeklyHeadlineSection({
  monthLabel,
  asOfDate,
  weeks,
}: {
  monthLabel: string
  asOfDate: string | null
  weeks: WeeklyHeadline[]
}) {
  if (weeks.length === 0) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">No weeks in this month range.</p>
      </section>
    )
  }

  const monthTotals = Object.fromEntries(
    METRICS.map(({ key }) => [
      key,
      Math.round(weeks.reduce((s, w) => s + w[key], 0) * 10) / 10,
    ])
  ) as Record<MetricKey, number>

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Weekly metrics — {monthLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Net capacity, planned, and remaining capacity are monthly snapshot values split by Mon–Fri
          weight. Remaining capacity is the ingested bench figure (net capacity minus planned hours at
          sync); hours logged as PTO are not subtracted in this row. PTO uses Tempo worklogs flagged as
          PTO in the reference month (by worklog date, through calendar month end, not the MTD cap used
          for billable and logged). Billable and logged stay MTD
          {asOfDate ? ` through ${asOfDate}` : ''}. Planned excludes PTO plan lines.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2 text-left text-xs font-normal text-muted-foreground">
                Metric
              </th>
              {weeks.map((w) => (
                <th
                  key={w.weekStart}
                  className="px-4 py-2 text-right text-xs font-normal text-muted-foreground tabular-nums"
                >
                  {format(parseISO(w.weekStart), 'MMM d')}
                </th>
              ))}
              <th className="border-l border-border px-4 py-2 text-right text-xs font-normal text-muted-foreground">
                Month
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ key, label, worklog }, idx) => {
              const isGroupBoundary = worklog && !METRICS[idx - 1]?.worklog
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-border/50 last:border-0',
                    isGroupBoundary && 'border-t border-border'
                  )}
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                  {weeks.map((w) => (
                    <td key={w.weekStart} className="px-4 py-2.5 text-right tabular-nums">
                      {fmt(w[key])}
                    </td>
                  ))}
                  <td className="border-l border-border px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {fmt(monthTotals[key])}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
