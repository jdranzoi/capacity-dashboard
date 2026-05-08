import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import {
  OVERVIEW_CHART_BAR_KEYS,
  OVERVIEW_METRIC_ROWS,
  type OverviewMetricKey,
} from '@/lib/overview/overview-metrics'
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns'

const BAR_KEYS = OVERVIEW_CHART_BAR_KEYS

function metricCssVar(key: OverviewMetricKey): string {
  const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key)
  return row ? `var(${row.cssVar})` : 'var(--muted-foreground)'
}

export function WeeklyEvolutionChart({
  weeks,
  className,
}: {
  weeks: WeeklyHeadline[];
  className?: string;
}) {
  // Tight left margin + wider groups/bars so the plot uses the card width; taller
  // plot area so flex growth reads as a fuller-height chart.
  const padL = 14;
  const padR = 10;
  const padT = 8;
  const padB = 28;
  const groupW = 66;
  const barW = 11;
  const barGap = 2;

  const flat: number[] = [];
  for (const w of weeks) {
    for (const k of BAR_KEYS) flat.push(w[k]);
    flat.push(w.loggedHours);
  }
  const maxVal = Math.max(1, ...flat);
  const plotH = 220;
  const w = padL + weeks.length * groupW + padR;
  const h = padT + plotH + padB;

  const yFor = (v: number) => padT + plotH - (v / maxVal) * plotH;

  const innerBarW = BAR_KEYS.length * barW + (BAR_KEYS.length - 1) * barGap;
  const barX0 = (gi: number) => padL + gi * groupW + (groupW - innerBarW) / 2;

  /** Logged line aligns to Planned bar (not group center). */
  const plannedBarIndex = BAR_KEYS.indexOf('plannedHours');
  const loggedLineX = (gi: number) =>
    barX0(gi) + plannedBarIndex * (barW + barGap) + barW / 2;

  const linePts = weeks.map((wk, gi) => {
    const cx = loggedLineX(gi);
    const y = yFor(wk.loggedHours);
    return `${cx},${y}`;
  });

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">
        Weekly evolution (hours)
      </p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <svg
          className="min-h-[clamp(13rem,32vh,22rem)] w-full flex-1 basis-0 text-[0.65rem] text-muted-foreground"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMinYMid meet"
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
                const val = wk[key];
                const bh = Math.max(0, (val / maxVal) * plotH);
                const x = barX0(gi) + j * (barW + barGap);
                const y = padT + plotH - bh;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={y}
                    width={barW}
                    height={bh}
                    rx={1.25}
                    fill={metricCssVar(key)}
                    opacity={0.92}
                  />
                );
              })}
              <text
                x={padL + gi * groupW + groupW / 2}
                y={h - 8}
                textAnchor="middle"
                fill="currentColor"
              >
                {format(parseISO(wk.weekStart), "MMM d")}
              </text>
            </g>
          ))}
          <polyline
            fill="none"
            stroke={metricCssVar("loggedHours")}
            strokeWidth={2.25}
            strokeDasharray="4 3"
            points={linePts.join(" ")}
          />
          {weeks.map((wk, gi) => {
            const cx = loggedLineX(gi);
            const cy = yFor(wk.loggedHours);
            return (
              <circle
                key={`dot-${wk.weekStart}`}
                cx={cx}
                cy={cy}
                r={3.5}
                fill={metricCssVar("loggedHours")}
              />
            );
          })}
        </svg>
        <div className="mt-2 shrink-0 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.7rem] text-muted-foreground">
          {BAR_KEYS.map((key) => {
            const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key)!;
            return (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: `var(${row.cssVar})` }}
                />
                {row.label}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full border-2"
              style={{ borderColor: metricCssVar("loggedHours") }}
            />
            Logged
          </span>
        </div>
      </div>
    </div>
  );
}

function Donut({
  pct,
  label,
  primaryCssVar,
  trackClassName = "stroke-muted/40",
  subtitle,
}: {
  pct: number;
  label: string;
  primaryCssVar: string;
  trackClassName?: string;
  /** Optional second line under `label` (small, muted). */
  subtitle?: string;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, pct));
  const dash = (p / 100) * c;

  return (
    <div className="flex w-full max-w-sm flex-row items-center gap-3">
      <svg
        width={88}
        height={88}
        viewBox="0 0 100 100"
        className="-rotate-90 shrink-0"
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
      <div className="flex min-h-[88px] min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {pct.toLocaleString("en-US", { maximumFractionDigits: 1 })}%
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {label}
        </p>
        {subtitle ? (
          <p className="text-[0.65rem] leading-snug text-muted-foreground/90">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function mtdUtilizationStrokeVar(pct: number): string {
  if (pct >= 65) return "--overview-utilization-good";
  if (pct >= 50) return "--overview-utilization-warn";
  if (pct >= 35) return "--overview-utilization-caution";
  return "--overview-utilization-critical";
}

function MtdUtilizationDonut({
  utilizationAvgPct,
}: {
  utilizationAvgPct: number | null;
}) {
  if (utilizationAvgPct == null) {
    return (
      <div className="flex w-full max-w-sm flex-row items-center gap-3">
        <div
          className="flex size-[88px] shrink-0 items-center justify-center rounded-full ring-1 ring-muted/40"
          aria-hidden
        >
          <span className="text-sm text-muted-foreground">—</span>
        </div>
        <div className="flex min-h-[88px] min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
          <p className="text-sm font-semibold tabular-nums text-muted-foreground">
            —
          </p>
          <p className="text-[0.7rem] leading-tight text-muted-foreground">
            Utilization (MTD)
          </p>
          <p className="text-[0.65rem] leading-snug text-muted-foreground/90">
            Mean per person vs net workdays (Mon–Fri, excl. PTO) · 8h/day
          </p>
        </div>
      </div>
    );
  }

  return (
    <Donut
      pct={utilizationAvgPct}
      label="Utilization (MTD)"
      subtitle="Mean per person vs net workdays (Mon–Fri, excl. PTO) · 8h/day"
      primaryCssVar={mtdUtilizationStrokeVar(utilizationAvgPct)}
    />
  );
}

export function CapacityUsageDonuts({
  net,
  planned,
  pto,
  mtdUtilizationAvgPct,
  className,
}: {
  net: number;
  planned: number;
  pto: number;
  mtdUtilizationAvgPct: number | null;
  className?: string;
}) {
  const planVsCap = net > 0 ? (planned / net) * 100 : 0;
  const ptoVsCap = net > 0 ? (pto / net) * 100 : 0;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">
        Capacity usage
      </p>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Donut
            pct={planVsCap}
            label="Plan / capacity"
            primaryCssVar="--overview-metric-planned"
          />
          <MtdUtilizationDonut utilizationAvgPct={mtdUtilizationAvgPct} />
          <Donut
            pct={ptoVsCap}
            label="PTO / capacity"
            primaryCssVar="--overview-metric-pto"
          />
        </div>
      </div>
    </div>
  );
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
    <div className="flex w-full max-w-sm flex-row items-center gap-3">
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center">
        <svg
          width={88}
          height={53}
          viewBox="0 0 120 72"
          className="shrink-0"
          role="img"
          aria-label={
            pct === null
              ? `${title}: no data`
              : `${title}: ${Math.round(p)} percent`
          }
        >
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
      </div>
      <div className="flex min-h-[88px] min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {pct === null
            ? "—"
            : `${pct.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`}
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {title}
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {goalLabel}
        </p>
      </div>
    </div>
  );
}

export function WorkloadGauges({
  planned,
  billable,
  productivityPct,
  efficiencyPct,
  className,
}: {
  planned: number;
  billable: number;
  productivityPct: number | null;
  efficiencyPct: number | null;
  className?: string;
}) {
  const billVsPlan = planned > 0 ? (billable / planned) * 100 : 0;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">
        Productivity &amp; efficiency
      </p>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Donut
            pct={billVsPlan}
            label="Billable / planned"
            primaryCssVar="--overview-metric-billable"
          />
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
    </div>
  );
}