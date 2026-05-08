import {
  CapacityUsageDonuts,
  WeeklyEvolutionChart,
  WorkloadGauges,
} from '@/components/overview/overview-workload-charts'
import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { Button } from '@/components/ui/button'
import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import {
  fmtHoursCell,
  fmtHoursKpi,
  fmtPct,
  OVERVIEW_METRIC_ROWS,
  overviewWeeklyBillableUtilizationPct,
  sumMetricTotals,
  type OverviewMetricKey,
} from '@/lib/overview/overview-metrics'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { cn } from '@/lib/utils'
import { addDays, format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { Suspense } from 'react'

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
        <p className={muted}>vs Plan {fmtHoursKpi(plan)}</p>
      )
    case 'plannedHours':
      if (net <= 0) {
        return <p className={muted}>vs Cap —</p>
      }
      return <p className={muted}>vs Cap {fmtHoursKpi(net)}</p>
    case 'availabilityHours':
      if (net <= 0) {
        return <p className={muted}>vs Cap —</p>
      }
      return <p className={muted}>vs Cap {fmtHoursKpi(net)}</p>
    case 'ptoHours':
      if (avail <= 0) {
        return <p className={muted}>vs Avail —</p>
      }
      return <p className={muted}>vs Avail {fmtHoursKpi(avail)}</p>
    case 'billableHours':
      if (plan <= 0) {
        return <p className={muted}>vs Planned —</p>
      }
      return <p className={muted}>vs Planned {fmtHoursKpi(plan)}</p>
    case 'loggedHours':
      if (plan <= 0) {
        return <p className={muted}>vs Planned —</p>
      }
      return <p className={muted}>vs Planned {fmtHoursKpi(plan)}</p>
    default:
      return null
  }
}

function FutureSlot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-xl border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground',
        className
      )}
    >
      <span className="shrink-0 font-medium tracking-tight text-foreground/85">{label}</span>
      <span className="mt-2 flex-1 text-[0.7rem] leading-snug">
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
  mtdUtilizationAvgPct,
  weeks,
  monthPicker,
}: {
  monthLabel: string
  asOfDate: string | null
  snapshotId: string | null
  syncCreatedAt: string | null
  mtdUtilizationAvgPct: number | null
  weeks: WeeklyHeadline[]
  /** When set, replaces the static week-range chip with a month dropdown + range hint. */
  monthPicker?: {
    options: OverviewMonthOption[]
    selectedMonthKey: string
  }
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
          {monthPicker ? (
            <div className="flex flex-col gap-1">
              <Suspense
                fallback={
                  <div
                    className="h-9 min-w-[11.5rem] animate-pulse rounded-lg bg-muted/40 ring-1 ring-foreground/10"
                    aria-hidden
                  />
                }
              >
                <OverviewMonthPicker
                  options={monthPicker.options}
                  selectedMonthKey={monthPicker.selectedMonthKey}
                />
              </Suspense>
              <p className="text-[0.7rem] text-muted-foreground tabular-nums">
                Weeks overlapping month: {rangeLabel}
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/25 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/10 tabular-nums">
              {rangeLabel}
            </p>
          )}
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

      <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch xl:grid-cols-6">
        {OVERVIEW_METRIC_ROWS.map((row) => (
            <div
              key={row.key}
              className="flex h-full min-h-0 flex-col rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10"
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
            </div>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[min(28rem,52vh)]">
        <div className="h-full min-h-0 lg:col-span-4">
          <WeeklyEvolutionChart weeks={weeks} className="h-full" />
        </div>
        <div className="h-full min-h-0 lg:col-span-3">
          <CapacityUsageDonuts
            net={totals.netCapacityHours}
            planned={totals.plannedHours}
            pto={totals.ptoHours}
            mtdUtilizationAvgPct={mtdUtilizationAvgPct}
            className="h-full"
          />
        </div>
        <div className="flex h-full min-h-0 lg:col-span-3">
          <WorkloadGauges
            planned={totals.plannedHours}
            billable={totals.billableHours}
            productivityPct={productivityPct}
            efficiencyPct={efficiencyPct}
            className="h-full w-full"
          />
        </div>
        <div className="h-full min-h-0 lg:col-span-2">
          <FutureSlot label="Filters" className="h-full min-h-[12rem] lg:min-h-0" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[min(32rem,58vh)]">
        <div className="flex h-full min-h-0 lg:col-span-7">
          <div className="flex h-full min-h-0 w-full flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
            <div className="mb-3 flex shrink-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <h2 className="text-sm font-medium tracking-tight">Weekly detail (hours)</h2>
              <p className="text-[0.65rem] text-muted-foreground">
                Billable and logged through{asOfDate ? ` ${asOfDate}` : ' —'}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-x-auto">
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
                <tr className="border-t border-border bg-muted/15">
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    Utilization
                  </td>
                  {weeks.map((w) => (
                    <td
                      key={`util-${w.weekStart}`}
                      className="px-4 py-2.5 text-right tabular-nums text-muted-foreground"
                    >
                      {fmtPct(
                        overviewWeeklyBillableUtilizationPct(
                          w.billableHours,
                          w.netCapacityHours
                        )
                      )}
                    </td>
                  ))}
                  <td className="border-l border-border px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {fmtPct(
                      overviewWeeklyBillableUtilizationPct(
                        totals.billableHours,
                        totals.netCapacityHours
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <div className="flex h-full min-h-0 lg:col-span-5">
          <div className="flex h-full min-h-0 w-full flex-col rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10">
            <h3 className="shrink-0 text-sm font-medium tracking-tight">Definitions</h3>
            <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto text-[0.7rem] leading-snug text-muted-foreground">
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
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/55" />
                <span>
                  <span className="font-medium text-foreground/90">
                    Utilization
                  </span>
                  {': '}
                  Billable hours divided by net capacity for that week (same ratio shape as C-005 billable vs
                  monthly target, using prorated net capacity per ISO week). MTD column uses total billable
                  divided by total net capacity. Implemented as{' '}
                  <span className="font-mono text-[0.65rem] text-foreground/80">
                    overviewWeeklyBillableUtilizationPct
                  </span>{' '}
                  in{' '}
                  <span className="font-mono text-[0.65rem] text-foreground/80">
                    lib/overview/overview-metrics.ts
                  </span>
                  . Differs from the Utilization (MTD) donut (mean per-person logged vs elapsed workdays at 8h/day).
                </span>
              </li>
            </ul>
            <div className="mt-4 shrink-0 border-t border-border pt-3 text-[0.65rem] text-muted-foreground">
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
