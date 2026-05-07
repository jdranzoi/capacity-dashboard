import {
  CapacityUsageDonuts,
  WeeklyEvolutionChart,
  WorkloadGauges,
} from '@/components/overview/overview-workload-charts'
import { Button } from '@/components/ui/button'
import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import {
  fmtHoursCell,
  fmtHoursKpi,
  fmtPct,
  OVERVIEW_METRIC_ROWS,
  sumMetricTotals,
  type OverviewMetricKey,
} from '@/lib/overview/overview-metrics'
import { cn } from '@/lib/utils'
import { addDays, format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import type { ReactNode } from 'react'

function MetricSparkline({
  values,
  cssVar,
}: {
  values: number[]
  cssVar: string
}) {
  const w = 112
  const h = 38
  const pad = 2
  if (values.length === 0) return null
  const max = Math.max(...values, 1e-9)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const innerW = w - 2 * pad
  const innerH = h - 2 * pad
  const pts = values.map((v, i) => {
    const x =
      pad + (i / Math.max(values.length - 1, 1)) * innerW
    const y = pad + innerH - ((v - min) / range) * innerH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg
      width={w}
      height={h}
      className="mt-3 w-full max-w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={`var(${cssVar})`}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(' ')}
        opacity={0.92}
      />
    </svg>
  )
}

function buildKpiSubline(
  totals: Record<OverviewMetricKey, number>,
  key: OverviewMetricKey
): ReactNode {
  const net = totals.netCapacityHours
  const plan = totals.plannedHours
  const avail = totals.availabilityHours
  const pto = totals.ptoHours
  const bill = totals.billableHours
  const log = totals.loggedHours

  const muted = 'text-[0.7rem] leading-snug text-muted-foreground'

  switch (key) {
    case 'netCapacityHours':
      if (plan <= 0) {
        return <p className={muted}>vs Plan —</p>
      }
      return (
        <p className={muted}>
          vs Plan {fmtHoursKpi(plan)} · {fmtPct(((net - plan) / plan) * 100)}
        </p>
      )
    case 'plannedHours':
      if (net <= 0) {
        return <p className={muted}>vs Cap —</p>
      }
      return (
        <p className={muted}>
          vs Cap {fmtHoursKpi(net)} · {fmtPct((plan / net) * 100)}
        </p>
      )
    case 'availabilityHours':
      if (net <= 0) {
        return <p className={muted}>vs Cap —</p>
      }
      return (
        <p className={muted}>
          vs Cap {fmtHoursKpi(net)} · {fmtPct((avail / net) * 100)}
        </p>
      )
    case 'ptoHours':
      if (avail <= 0) {
        return <p className={muted}>vs Avail —</p>
      }
      return (
        <p className={muted}>
          vs Avail {fmtHoursKpi(avail)} · {fmtPct((pto / avail) * 100)}
        </p>
      )
    case 'billableHours':
      if (plan <= 0) {
        return <p className={muted}>vs Planned —</p>
      }
      return (
        <p className={muted}>
          vs Planned {fmtHoursKpi(plan)} · {fmtPct((bill / plan) * 100)}
        </p>
      )
    case 'loggedHours':
      if (plan <= 0) {
        return <p className={muted}>vs Planned —</p>
      }
      return (
        <p className={muted}>
          vs Planned {fmtHoursKpi(plan)} · {fmtPct((log / plan) * 100)}
        </p>
      )
    default:
      return null
  }
}

function FutureSlot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground',
        className
      )}
    >
      <span className="font-medium text-foreground/85">{label}</span>
      <span className="mt-2 text-[0.7rem] leading-snug">
        Reserved for a future release.
      </span>
    </div>
  )
}

export function WeeklyHeadlineSection({
  monthLabel,
  asOfDate,
  snapshotId,
  syncCreatedAt,
  weeks,
}: {
  monthLabel: string
  asOfDate: string | null
  snapshotId: string | null
  syncCreatedAt: string | null
  weeks: WeeklyHeadline[]
}) {
  if (weeks.length === 0) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">No weeks in this month range.</p>
      </section>
    )
  }

  const totals = Object.fromEntries(
    OVERVIEW_METRIC_ROWS.map(({ key }) => [key, sumMetricTotals(weeks, key)])
  ) as Record<OverviewMetricKey, number>

  const productivityPct =
    totals.plannedHours > 0
      ? (totals.loggedHours / totals.plannedHours) * 100
      : null
  const efficiencyPct =
    totals.loggedHours > 0
      ? (totals.billableHours / totals.loggedHours) * 100
      : null

  const firstWeek = parseISO(weeks[0].weekStart)
  const lastWeekEnd = addDays(parseISO(weeks[weeks.length - 1].weekStart), 6)
  const rangeLabel = `${format(firstWeek, 'MMM d')} – ${format(lastWeekEnd, 'MMM d, yyyy')}`

  const lastUpdateLabel =
    syncCreatedAt != null
      ? format(parseISO(syncCreatedAt), 'MMM d, yyyy HH:mm')
      : null

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border/80 pb-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Workload performance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span>Weekly view — {monthLabel}</span>
              {snapshotId ? (
                <>
                  <span className="mx-2 text-border">·</span>
                  <span className="font-mono text-xs text-muted-foreground/95">
                    Snapshot {snapshotId}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <p className="rounded-lg bg-muted/25 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/10 tabular-nums">
            {rangeLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <FutureSlot label="Compare with" className="min-w-[200px] flex-1 py-2.5 lg:flex-none" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
              title="Export is not available yet"
            >
              <Download className="size-4" aria-hidden />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {OVERVIEW_METRIC_ROWS.map((row) => {
          const values = weeks.map((w) => w[row.key])
          return (
            <div
              key={row.key}
              className="flex flex-col rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {row.label} (MTD)
              </p>
              <p
                className="mt-1 text-lg font-semibold tabular-nums tracking-tight"
                style={{ color: `var(${row.cssVar})` }}
              >
                {fmtHoursKpi(totals[row.key])}
              </p>
              {buildKpiSubline(totals, row.key)}
              <MetricSparkline values={values} cssVar={row.cssVar} />
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WeeklyEvolutionChart weeks={weeks} />
        </div>
        <div className="lg:col-span-3">
          <CapacityUsageDonuts
            net={totals.netCapacityHours}
            planned={totals.plannedHours}
            availability={totals.availabilityHours}
            pto={totals.ptoHours}
            billable={totals.billableHours}
          />
        </div>
        <div className="lg:col-span-2 lg:self-start">
          <FutureSlot label="Filters" className="min-h-[220px] lg:min-h-[min(100%,320px)]" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-6">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Weekly detail (hours)</h2>
            <p className="text-[0.65rem] text-muted-foreground">
              Billable and logged through{asOfDate ? ` ${asOfDate}` : ' —'}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Metric
                  </th>
                  {weeks.map((w) => (
                    <th
                      key={w.weekStart}
                      className="px-4 py-2.5 text-right text-xs font-normal text-muted-foreground tabular-nums"
                    >
                      {format(parseISO(w.weekStart), 'MMM d')}
                    </th>
                  ))}
                  <th className="border-l border-border px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    MTD total
                  </th>
                </tr>
              </thead>
              <tbody>
                {OVERVIEW_METRIC_ROWS.map((rowDef, idx) => {
                  const { key, label, worklog } = rowDef
                  const isGroupBoundary =
                    worklog && !OVERVIEW_METRIC_ROWS[idx - 1]?.worklog
                  return (
                    <tr
                      key={key}
                      className={cn(
                        'border-b border-border/45 last:border-0',
                        isGroupBoundary && 'border-t border-border'
                      )}
                    >
                      <td
                        className="px-4 py-2.5 font-medium"
                        style={{ color: `var(${rowDef.cssVar})` }}
                      >
                        {label}
                      </td>
                      {weeks.map((w) => (
                        <td
                          key={w.weekStart}
                          className="px-4 py-2.5 text-right tabular-nums"
                        >
                          {fmtHoursCell(w[key])}
                        </td>
                      ))}
                      <td className="border-l border-border px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtHoursCell(totals[key])}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3">
          <WorkloadGauges
            productivityPct={productivityPct}
            efficiencyPct={efficiencyPct}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10">
            <h3 className="text-sm font-medium">Definitions</h3>
            <ul className="mt-3 space-y-2 text-[0.7rem] leading-snug text-muted-foreground">
              {OVERVIEW_METRIC_ROWS.map((row) => (
                <li key={row.key} className="flex gap-2">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(${row.cssVar})` }}
                  />
                  <span>
                    <span className="font-medium text-foreground/90">
                      {row.label}
                    </span>
                    {': '}
                    {definitionBlurb(row.key)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-3 text-[0.65rem] text-muted-foreground">
              <p>Source: Tempo (ingested via capacity sync)</p>
              {lastUpdateLabel ? (
                <p className="mt-1">Last sync: {lastUpdateLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function definitionBlurb(key: OverviewMetricKey): string {
  switch (key) {
    case 'netCapacityHours':
      return 'Zone-adjusted capacity from the latest snapshot, prorated by Mon–Fri overlap with each ISO week in the month.'
    case 'plannedHours':
      return 'Planned hours from the latest snapshot, excluding PTO plan lines; same proration as net capacity.'
    case 'availabilityHours':
      return 'Bench availability from the latest snapshot (ingested net capacity minus planned); same proration as capacity rows.'
    case 'ptoHours':
      return 'Hours logged as PTO in the reference month (by worklog date through calendar month end).'
    case 'billableHours':
      return 'Billable hours from worklogs in scope for the MTD worklog cap (month end, last sync, and today).'
    case 'loggedHours':
      return 'Total logged hours from non-PTO worklogs under the same MTD cap as billable.'
    default:
      return ''
  }
}
