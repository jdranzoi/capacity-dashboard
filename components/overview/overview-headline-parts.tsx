import {
  CapacityUsageDonuts,
  WeeklyEvolutionChart,
  WorkloadGauges,
} from '@/components/overview/overview-workload-charts'
import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { Button } from '@/components/ui/button'
import {
  billableVersusLoggedEfficiencyPct,
  capacityFillPct,
  loggedVersusPlannedProductivityPct,
} from '@/lib/domain/workload-metrics'
import { CAPACITY_FILL_KPI } from '@/lib/overview/capacity-kpi-contract'
import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import {
  fmtHoursCell,
  fmtHoursKpi,
  fmtPct,
  OVERVIEW_METRIC_ROWS,
  sumMetricTotals,
  type OverviewMetricKey,
} from '@/lib/overview/overview-metrics'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import {
  KPI_METRICS_GRID_CLASS,
  KpiMetricCard,
} from "@/components/dashboard/kpi-metric-card";
import { cn } from '@/lib/utils'
import { addDays, format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import type { ReactNode } from 'react'

function buildKpiSubline(
  totals: Record<OverviewMetricKey, number>,
  key: OverviewMetricKey
): ReactNode {
  const net = totals.netCapacityHours
  const plan = totals.plannedHours
  const muted = 'text-[0.7rem] leading-snug text-muted-foreground'

  switch (key) {
    case 'netCapacityHours':
      if (plan <= 0) return <p className={muted}>vs Plan —</p>
      return <p className={muted}>vs Plan {fmtHoursKpi(plan)}</p>
    case 'plannedHours':
      if (net <= 0) return <p className={muted}>vs Cap —</p>
      return <p className={muted}>vs Cap {fmtHoursKpi(net)}</p>
    case 'ptoHours':
      if (net <= 0) return <p className={muted}>vs Cap —</p>
      return <p className={muted}>vs Cap {fmtHoursKpi(net)}</p>
    case 'loggedHours':
      if (plan <= 0) return <p className={muted}>vs Planned —</p>
      return <p className={muted}>vs Planned {fmtHoursKpi(plan)}</p>
    case 'billableHours':
      if (plan <= 0) return <p className={muted}>vs Planned —</p>
      return <p className={muted}>vs Planned {fmtHoursKpi(plan)}</p>
    default:
      return null
  }
}

export function OverviewPageTitle() {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Workload performance</h1>
    </div>
  )
}

export function OverviewToolbarPanel({
  rangeLabel,
  monthPicker,
}: {
  rangeLabel: string
  monthPicker: {
    options: OverviewMonthOption[]
    selectedMonthKey: string
  }
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <OverviewMonthPicker
          options={monthPicker.options}
          selectedMonthKey={monthPicker.selectedMonthKey}
        />
        <p className="text-[0.7rem] text-muted-foreground tabular-nums">
          Weeks overlapping month: {rangeLabel}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
  );
}

export function OverviewKpiCards({ weeks }: { weeks: WeeklyHeadline[] }) {
  const totals = Object.fromEntries(
    OVERVIEW_METRIC_ROWS.map(({ key }) => [key, sumMetricTotals(weeks, key)])
  ) as Record<OverviewMetricKey, number>

  return (
    <div className={KPI_METRICS_GRID_CLASS}>
      {OVERVIEW_METRIC_ROWS.map((row) => (
        <KpiMetricCard
          key={row.key}
          label={`${row.label} (MTD)`}
          value={fmtHoursKpi(totals[row.key])}
          valueColorVar={row.cssVar}
          subline={buildKpiSubline(totals, row.key)}
        />
      ))}
    </div>
  );
}

export function OverviewChartsRow({
  weeks,
  utilizationPct,
}: {
  weeks: WeeklyHeadline[]
  utilizationPct: number | null
}) {
  const totals = Object.fromEntries(
    OVERVIEW_METRIC_ROWS.map(({ key }) => [key, sumMetricTotals(weeks, key)])
  ) as Record<OverviewMetricKey, number>

  const productivityPct = loggedVersusPlannedProductivityPct(
    totals.loggedHours,
    totals.plannedHours
  )
  const efficiencyPct = billableVersusLoggedEfficiencyPct(
    totals.billableHours,
    totals.loggedHours
  )

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch lg:min-h-[min(28rem,52vh)]">
      <div className="h-full min-h-0">
        <WeeklyEvolutionChart weeks={weeks} className="h-full" />
      </div>
      <div className="h-full min-h-0">
        <CapacityUsageDonuts
          logged={totals.loggedHours}
          net={totals.netCapacityHours}
          planned={totals.plannedHours}
          utilizationPct={utilizationPct}
          className="h-full"
        />
      </div>
      <div className="flex h-full min-h-0">
        <WorkloadGauges
          planned={totals.plannedHours}
          billable={totals.billableHours}
          productivityPct={productivityPct}
          efficiencyPct={efficiencyPct}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

function definitionBlurb(key: OverviewMetricKey): string {
  switch (key) {
    case 'netCapacityHours':
      return 'Zone-adjusted capacity from the latest snapshot, prorated by Mon–Fri overlap with each ISO week in the month.'
    case 'plannedHours':
      return 'Planned hours from the latest snapshot, excluding PTO plan lines; same proration as net capacity.'
    case 'ptoHours':
      return 'Hours logged as PTO in the reference month (by worklog date through calendar month end).'
    case 'loggedHours':
      return 'Total logged hours from non-PTO worklogs under the same MTD cap as billable.'
    case 'billableHours':
      return 'Billable hours from worklogs in scope for the MTD worklog cap (month end, last sync, and today).'
    default:
      return ''
  }
}

export function OverviewWeeklyDetailPanel({
  weeks,
  asOfDate,
  syncCreatedAt,
}: {
  weeks: WeeklyHeadline[]
  asOfDate: string | null
  syncCreatedAt: string | null
}) {
  const totals = Object.fromEntries(
    OVERVIEW_METRIC_ROWS.map(({ key }) => [key, sumMetricTotals(weeks, key)])
  ) as Record<OverviewMetricKey, number>

  const lastUpdateLabel =
    syncCreatedAt != null
      ? format(parseISO(syncCreatedAt), 'MMM d, yyyy HH:mm')
      : null

  return (
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
                  <td className="px-4 py-2.5 font-medium text-foreground">{CAPACITY_FILL_KPI.label}</td>
                  {weeks.map((w) => (
                    <td
                      key={`fill-${w.weekStart}`}
                      className="px-4 py-2.5 text-right tabular-nums text-muted-foreground"
                    >
                      {fmtPct(
                        capacityFillPct(
                          w.loggedHours,
                          w.netCapacityHours
                        )
                      )}
                    </td>
                  ))}
                  <td className="border-l border-border px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {fmtPct(
                      capacityFillPct(
                        totals.loggedHours,
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
                  <span className="font-medium text-foreground/90">{row.label}</span>
                  {': '}
                  {definitionBlurb(row.key)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 shrink-0 border-t border-border pt-3 text-[0.65rem] text-muted-foreground">
            <p>Source: Tempo (ingested via capacity sync)</p>
            {lastUpdateLabel ? <p className="mt-1">Last sync: {lastUpdateLabel}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function overviewRangeLabel(weeks: WeeklyHeadline[]): string {
  const firstWeek = parseISO(weeks[0].weekStart)
  const lastWeekEnd = addDays(parseISO(weeks[weeks.length - 1].weekStart), 6)
  return `${format(firstWeek, 'MMM d')} – ${format(lastWeekEnd, 'MMM d, yyyy')}`
}
