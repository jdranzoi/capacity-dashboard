'use client'

import { cn } from '@/lib/utils'
import type { PlanningProjectRow, PlanningRoleRow } from '@/lib/capacity/planning/load-capacity-planning'

// Project type → CSS var mapping (consistent with existing metric palette)
function projectTypeCssVar(type: string): string {
  switch (type.toLowerCase()) {
    case 'build':
      return 'var(--overview-metric-billable)'
    case 'support':
      return 'var(--overview-metric-pto)'
    case 'internal':
      return 'var(--overview-metric-net)'
    default:
      return 'var(--overview-metric-logged)'
  }
}

function projectTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'build': return 'Build'
    case 'support': return 'Support'
    case 'internal': return 'Internal'
    default: return type
  }
}

// ──────────────────────────────────────────────
// Role horizontal bar chart
// ──────────────────────────────────────────────

export function PlanningRoleChart({
  rows,
  className,
}: {
  rows: PlanningRoleRow[]
  className?: string
}) {
  const maxHours = Math.max(1, ...rows.map((r) => r.netCapacityHours))
  const barH = 10
  const gap = 6
  const labelW = 92
  const trackW = 220
  const pctW = 44
  const padT = 4
  const padB = 4
  const totalH = padT + rows.length * (barH + gap) - gap + padB
  const svgW = labelW + trackW + pctW + 8

  const barX = labelW + 4

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">Planned by role</p>
      <p className="mt-0.5 shrink-0 text-[0.7rem] text-muted-foreground">
        Net capacity (track) vs planned (bar)
      </p>
      <div className="mt-3 min-h-0 flex-1">
        <svg
          className="w-full text-[0.65rem] text-muted-foreground"
          viewBox={`0 0 ${svgW} ${totalH}`}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label="Planned hours by role"
        >
          {rows.map((row, i) => {
            const y = padT + i * (barH + gap)
            const capW = (row.netCapacityHours / maxHours) * trackW
            const planW = (row.plannedHours / maxHours) * trackW

            return (
              <g key={row.roleKey}>
                {/* Role label */}
                <text
                  x={labelW - 6}
                  y={y + barH / 2 + 4}
                  textAnchor="end"
                  fill="currentColor"
                >
                  {row.roleLabel}
                </text>

                {/* Net capacity track */}
                <rect
                  x={barX}
                  y={y}
                  width={capW}
                  height={barH}
                  rx={3}
                  fill="var(--overview-metric-net)"
                  opacity={0.18}
                />

                {/* Planned bar */}
                {planW > 0 && (
                  <rect
                    x={barX}
                    y={y}
                    width={planW}
                    height={barH}
                    rx={3}
                    fill="var(--overview-metric-planned)"
                    opacity={0.88}
                  />
                )}

                {/* Planned % label */}
                <text
                  x={barX + trackW + 6}
                  y={y + barH / 2 + 4}
                  fill="currentColor"
                >
                  {row.plannedPct != null ? `${row.plannedPct}%` : '—'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-3 shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: 'var(--overview-metric-net)', opacity: 0.4 }} />
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
// Project vertical bar chart (top N)
// ──────────────────────────────────────────────

const TOP_N = 10

export function PlanningProjectChart({
  rows,
  className,
}: {
  rows: PlanningProjectRow[]
  className?: string
}) {
  const top = rows.slice(0, TOP_N)
  const maxHours = Math.max(1, ...top.map((r) => r.plannedHours))

  const padL = 8
  const padR = 8
  const padT = 8
  const padB = 40
  const plotH = 180
  const groupW = Math.floor((320 - padL - padR) / Math.max(top.length, 1))
  const barW = Math.max(8, groupW - 10)
  const svgW = padL + top.length * groupW + padR
  const svgH = padT + plotH + padB

  const barX = (i: number) => padL + i * groupW + (groupW - barW) / 2

  // Project type legend deduplication
  const legendTypes = Array.from(new Set(top.map((r) => r.projectType)))

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">Top projects by planned hours</p>
      <p className="mt-0.5 shrink-0 text-[0.7rem] text-muted-foreground">
        Colored by project type
      </p>
      <div className="mt-3 min-h-0 flex-1">
        <svg
          className="w-full text-[0.65rem] text-muted-foreground"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label="Top projects by planned hours"
        >
          {/* Baseline */}
          <line
            x1={padL}
            y1={padT + plotH}
            x2={svgW - padR}
            y2={padT + plotH}
            className="stroke-border"
            strokeWidth={1}
          />

          {top.map((row, i) => {
            const bh = Math.max(2, (row.plannedHours / maxHours) * plotH)
            const x = barX(i)
            const y = padT + plotH - bh
            const cx = padL + i * groupW + groupW / 2

            return (
              <g key={row.projectId}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={bh}
                  rx={2}
                  fill={projectTypeCssVar(row.projectType)}
                  opacity={0.82}
                />
                {/* Project key label — rotated */}
                <text
                  x={cx}
                  y={padT + plotH + 6}
                  textAnchor="end"
                  fill="currentColor"
                  transform={`rotate(-40, ${cx}, ${padT + plotH + 6})`}
                >
                  {row.projectKey}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-1 shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
        {legendTypes.map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm"
              style={{ background: projectTypeCssVar(type) }}
            />
            {projectTypeLabel(type)}
          </span>
        ))}
      </div>
    </div>
  )
}
