import type { WeeklyHeadline } from "@/lib/overview/load-weekly-overview";
import {
  OVERVIEW_CHART_BAR_KEYS,
  OVERVIEW_METRIC_ROWS,
  type OverviewMetricKey,
} from "@/lib/overview/overview-metrics";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const BAR_KEYS = OVERVIEW_CHART_BAR_KEYS;

function metricCssVar(key: OverviewMetricKey): string {
  const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key);
  return row ? `var(${row.cssVar})` : "var(--muted-foreground)";
}

export function WeeklyEvolutionChart({
  weeks,
  className,
}: {
  weeks: WeeklyHeadline[];
  className?: string;
}) {
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
  const plannedBarIndex = BAR_KEYS.indexOf("plannedHours");
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
        <div className="mt-2 shrink-0 flex flex-wrap gap-3 text-[0.7rem] text-muted-foreground">
          {BAR_KEYS.map((key) => {
            const row = OVERVIEW_METRIC_ROWS.find((r) => r.key === key)!;
            return (
              <span key={key} className="inline-flex items-center gap-3">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: `var(${row.cssVar})` }}
                />
                {row.label}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-3">
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
