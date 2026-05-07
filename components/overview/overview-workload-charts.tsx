import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import {
  OVERVIEW_CHART_BAR_KEYS,
  OVERVIEW_METRIC_ROWS,
  type OverviewMetricKey,
} from '@/lib/overview/overview-metrics'
import { format, parseISO } from 'date-fns'

const BAR_KEYS = OVERVIEW_CHART_BAR_KEYS

function metricCssVar(key: OverviewMetricKey): string {
  const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key)
  return row ? `var(${row.cssVar})` : 'var(--muted-foreground)'
}

export function WeeklyEvolutionChart({ weeks }: { weeks: WeeklyHeadline[] }) {
  const padL = 40
  const padR = 12
  const padT = 10
  const padB = 32
  const groupW = 54
  const barW = 7.5
  const barGap = 2

  const flat: number[] = []
  for (const w of weeks) {
    for (const k of BAR_KEYS) flat.push(w[k])
    flat.push(w.loggedHours)
  }
  const maxVal = Math.max(1, ...flat)
  const plotH = 148
  const w = padL + weeks.length * groupW + padR
  const h = padT + plotH + padB

  const yFor = (v: number) => padT + plotH - (v / maxVal) * plotH

  const innerBarW = BAR_KEYS.length * barW + (BAR_KEYS.length - 1) * barGap
  const barX0 = (gi: number) =>
    padL + gi * groupW + (groupW - innerBarW) / 2

  const linePts = weeks.map((wk, gi) => {
    const cx =
      barX0(gi) + innerBarW / 2
    const y = yFor(wk.loggedHours)
    return `${cx},${y}`
  })

  return (
    <div className="rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
      <p className="text-sm font-medium">Weekly evolution (hours)</p>
      <svg
        className="mt-3 w-full max-h-[220px] text-[0.65rem] text-muted-foreground"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Grouped weekly hours by metric with logged hours as a line"
      >
        <line
          x1={padL}
          y1={padT + plotH}
          x2={w - padR}
          y2={padT + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        {weeks.map((wk, gi) => (
          <g key={wk.weekStart}>
            {BAR_KEYS.map((key, j) => {
              const val = wk[key]
              const bh = Math.max(0, (val / maxVal) * plotH)
              const x = barX0(gi) + j * (barW + barGap)
              const y = padT + plotH - bh
              return (
                <rect
                  key={key}
                  x={x}
                  y={y}
                  width={barW}
                  height={bh}
                  rx={1}
                  fill={metricCssVar(key)}
                  opacity={0.92}
                />
              )
            })}
            <text
              x={padL + gi * groupW + groupW / 2}
              y={h - 8}
              textAnchor="middle"
              fill="currentColor"
            >
              {format(parseISO(wk.weekStart), 'MMM d')}
            </text>
          </g>
        ))}
        <polyline
          fill="none"
          stroke={metricCssVar('loggedHours')}
          strokeWidth={2}
          strokeDasharray="4 3"
          points={linePts.join(' ')}
        />
        {weeks.map((wk, gi) => {
          const cx = barX0(gi) + innerBarW / 2
          const cy = yFor(wk.loggedHours)
          return (
            <circle
              key={`dot-${wk.weekStart}`}
              cx={cx}
              cy={cy}
              r={3}
              fill={metricCssVar('loggedHours')}
            />
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.7rem] text-muted-foreground">
        {BAR_KEYS.map((key) => {
          const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key)!
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: `var(${row.cssVar})` }}
              />
              {row.label}
            </span>
          )
        })}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full border-2"
            style={{ borderColor: metricCssVar('loggedHours') }}
          />
          Logged
        </span>
      </div>
    </div>
  )
}

function Donut({
  pct,
  label,
  primaryCssVar,
  trackClassName = 'stroke-muted/40',
}: {
  pct: number
  label: string
  primaryCssVar: string
  trackClassName?: string
}) {
  const r = 36
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const dash = (p / 100) * c

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <svg
        width={88}
        height={88}
        viewBox="0 0 100 100"
        className="-rotate-90"
        role="img"
        aria-label={`${label}: ${Math.round(p)} percent`}
      >
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          className={trackClassName}
          strokeWidth={10}
        />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={`var(${primaryCssVar})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {pct.toLocaleString('en-US', { maximumFractionDigits: 1 })}%
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function CapacityUsageDonuts({
  net,
  planned,
  availability,
  pto,
  billable,
}: {
  net: number
  planned: number
  availability: number
  pto: number
  billable: number
}) {
  const planVsCap = net > 0 ? (planned / net) * 100 : 0
  const ptoVsAvail =
    availability > 0 ? (pto / availability) * 100 : 0
  const billVsPlan = planned > 0 ? (billable / planned) * 100 : 0

  return (
    <div className="rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
      <p className="text-sm font-medium">Capacity usage (MTD)</p>
      <div className="mt-4 flex flex-wrap justify-center gap-6 sm:justify-between">
        <Donut
          pct={planVsCap}
          label="Plan / capacity"
          primaryCssVar="--overview-metric-planned"
        />
        <Donut
          pct={ptoVsAvail}
          label="PTO / availability"
          primaryCssVar="--overview-metric-pto"
        />
        <Donut
          pct={billVsPlan}
          label="Billable / planned"
          primaryCssVar="--overview-metric-billable"
        />
      </div>
    </div>
  )
}

const SEMI_ARC_LEN = Math.PI * 40

function SemiGauge({
  pct,
  title,
  goalLabel,
}: {
  pct: number | null
  title: string
  goalLabel: string
}) {
  const p = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  const dash = (p / 100) * SEMI_ARC_LEN

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <svg width={120} height={72} viewBox="0 0 120 72" aria-hidden>
        <path
          d="M 20 58 A 40 40 0 0 1 100 58"
          fill="none"
          className="stroke-muted/40"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {pct !== null ? (
          <path
            d="M 20 58 A 40 40 0 0 1 100 58"
            fill="none"
            stroke="var(--overview-metric-logged)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${SEMI_ARC_LEN}`}
          />
        ) : null}
      </svg>
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold tabular-nums text-foreground">
          {pct === null
            ? '—'
            : `${pct.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`}
        </p>
        <p className="text-[0.7rem] text-muted-foreground">{goalLabel}</p>
      </div>
    </div>
  )
}

export function WorkloadGauges({
  productivityPct,
  efficiencyPct,
}: {
  productivityPct: number | null
  efficiencyPct: number | null
}) {
  return (
    <div className="rounded-xl bg-card px-4 py-5 text-card-foreground ring-1 ring-foreground/10">
      <div className="flex flex-wrap justify-center gap-10 md:justify-between">
        <SemiGauge
          title="Productivity (logged / planned)"
          pct={productivityPct}
          goalLabel="Goal: > 80%"
        />
        <SemiGauge
          title="Efficiency (billable / logged)"
          pct={efficiencyPct}
          goalLabel="Goal: > 90%"
        />
      </div>
    </div>
  )
}