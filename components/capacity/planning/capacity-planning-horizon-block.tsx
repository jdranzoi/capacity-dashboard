'use client'

import { cn } from '@/lib/utils'
import type { HorizonMonthPoint } from '@/lib/capacity/planning/load-capacity-horizon'
import { fmtHoursCell, fmtPct } from '@/lib/overview/overview-metrics'

// ──────────────────────────────────────────────
// Horizon timeline chart
// ──────────────────────────────────────────────

export function PlanningHorizonChart({
  months,
  className,
}: {
  months: HorizonMonthPoint[]
  className?: string
}) {
  if (months.length === 0) return null

  const maxHours = Math.max(1, ...months.map((m) => m.netCapacityHours))

  const padL = 10
  const padR = 10
  const padT = 10
  const padB = 28
  const plotH = 160
  const groupW = 56
  const barW = 12
  const barGap = 2
  const svgW = padL + months.length * groupW + padR
  const svgH = padT + plotH + padB

  const barX0 = (gi: number) =>
    padL + gi * groupW + (groupW - (barW * 2 + barGap)) / 2

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">Capacity horizon</p>
      <p className="mt-0.5 shrink-0 text-[0.7rem] text-muted-foreground">
        Net capacity vs planned over last months
      </p>
      <div className="mt-3 min-h-0 flex-1">
        <svg
          className="w-full text-[0.65rem] text-muted-foreground"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label="Capacity and planned hours by month"
        >
          <line
            x1={padL}
            y1={padT + plotH}
            x2={svgW - padR}
            y2={padT + plotH}
            className="stroke-border"
            strokeWidth={1}
          />

          {months.map((m, gi) => {
            const capH = Math.max(2, (m.netCapacityHours / maxHours) * plotH)
            const planH = m.plannedHours > 0 ? Math.max(2, (m.plannedHours / maxHours) * plotH) : 0

            const x0 = barX0(gi)
            const x1 = x0 + barW + barGap
            const labelCx = padL + gi * groupW + groupW / 2

            return (
              <g key={m.monthKey}>
                {/* Current month highlight strip */}
                {m.isCurrent && (
                  <rect
                    x={padL + gi * groupW}
                    y={padT - 4}
                    width={groupW}
                    height={plotH + 4}
                    rx={4}
                    fill="var(--overview-metric-planned)"
                    opacity={0.05}
                  />
                )}

                {/* Net capacity bar */}
                <rect
                  x={x0}
                  y={padT + plotH - capH}
                  width={barW}
                  height={capH}
                  rx={2}
                  fill="var(--overview-metric-net)"
                  opacity={m.isCurrent ? 0.65 : 0.35}
                />

                {/* Planned bar */}
                {planH > 0 && (
                  <rect
                    x={x1}
                    y={padT + plotH - planH}
                    width={barW}
                    height={planH}
                    rx={2}
                    fill="var(--overview-metric-planned)"
                    opacity={m.isCurrent ? 0.9 : 0.65}
                  />
                )}

                {/* Month label */}
                <text
                  x={labelCx}
                  y={padT + plotH + 16}
                  textAnchor="middle"
                  fill="currentColor"
                  fontWeight={m.isCurrent ? '600' : undefined}
                >
                  {m.monthLabel.split(' ')[0].slice(0, 3)}
                  {' '}
                  {m.monthLabel.split(' ')[1]?.slice(2)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-2 shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: 'var(--overview-metric-net)', opacity: 0.55 }} />
          Net capacity
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: 'var(--overview-metric-planned)' }} />
          Planned
        </span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Horizon summary table
// ──────────────────────────────────────────────

export function PlanningHorizonTable({
  months,
  className,
}: {
  months: HorizonMonthPoint[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium tracking-tight">Monthly breakdown</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Month</th>
              <th className="px-4 py-2.5 text-right font-medium">Net cap.</th>
              <th className="px-4 py-2.5 text-right font-medium">Planned</th>
              <th className="px-4 py-2.5 text-right font-medium">Coverage</th>
              <th className="px-4 py-2.5 text-right font-medium">Gap</th>
              <th className="px-4 py-2.5 text-right font-medium">Bench</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const gapSign = m.gapHours >= 0 ? '+' : ''
              const isOver = m.gapHours < 0
              return (
                <tr
                  key={m.monthKey}
                  className={cn(
                    'border-b border-border/50 tabular-nums transition-colors',
                    m.isCurrent
                      ? 'bg-foreground/[0.03]'
                      : 'hover:bg-foreground/[0.02]'
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        m.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {m.monthLabel}
                    </span>
                    {m.isCurrent && (
                      <span className="ml-2 rounded-sm bg-foreground/10 px-1 py-0.5 text-[10px] font-medium text-foreground/70">
                        selected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {fmtHoursCell(m.netCapacityHours)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">
                    {fmtHoursCell(m.plannedHours)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">
                    {fmtPct(m.plannedCoveragePct)}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right text-xs font-medium',
                      isOver ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {gapSign}
                    {fmtHoursCell(m.gapHours)}h
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {m.benchHours > 0 ? fmtHoursCell(m.benchHours) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
