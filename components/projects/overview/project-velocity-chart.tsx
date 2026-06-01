'use client'

import {
  PROJECT_CHART_AXIS_CLASS,
  PROJECT_CHART_AXIS_FONT_PX,
  PROJECT_CHART_VALUE_CLASS,
  PROJECT_CHART_VALUE_FONT_PX,
  formatBarHoursLabel,
  formatYAxisTickHours,
} from '@/components/projects/overview/project-chart-styles'
import type { ProjectVelocityWeekPoint } from '@/lib/projects/overview/projects-types'

function axisMax(value: number): number {
  if (value <= 0) return 8
  return Math.ceil(value / 20) * 20 || 20
}

export function ProjectVelocityChart({
  weeks,
  ariaLabel,
}: {
  weeks: readonly ProjectVelocityWeekPoint[]
  ariaLabel: string
}) {
  if (weeks.length === 0) {
    return <p className="text-xs text-muted-foreground">No logged hours in the last 6 weeks.</p>
  }

  const w = 360
  const padL = 32
  const padR = 8
  const padT = 14
  const padB = 36
  const plotW = w - padL - padR
  const plotH = 114 - padT
  const h = padT + plotH + padB

  const maxY = axisMax(Math.max(...weeks.map((p) => p.loggedHours)))
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxY / tickCount) * i)

  const n = weeks.length
  const slotW = plotW / n
  const barW = Math.min(20, Math.max(8, slotW * 0.4))
  const toY = (hours: number) => padT + plotH - (hours / maxY) * plotH
  const axisBaselineY = padT + plotH

  return (
    <svg
      className="w-full text-muted-foreground"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((tick) => {
        const y = toY(tick)
        return (
          <g key={tick}>
            <line
              x1={padL}
              y1={y}
              x2={w - padR}
              y2={y}
              className="stroke-border/70"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : '2 3'}
            />
            <text
              x={padL - 4}
              y={y + 2}
              textAnchor="end"
              fontSize={PROJECT_CHART_AXIS_FONT_PX}
              className={PROJECT_CHART_AXIS_CLASS}
            >
              {formatYAxisTickHours(tick)}
            </text>
          </g>
        )
      })}

      <line
        x1={padL}
        y1={axisBaselineY}
        x2={w - padR}
        y2={axisBaselineY}
        className="stroke-border"
        strokeWidth={1}
      />

      {weeks.map((point, i) => {
        const barH = (point.loggedHours / maxY) * plotH
        const cx = padL + slotW * i + slotW / 2
        const x = cx - barW / 2
        const y = axisBaselineY - barH
        const labelY = axisBaselineY + 2
        const valueLabel = formatBarHoursLabel(point.loggedHours)
        const inside = barH > 0 && barH < 14

        return (
          <g key={`${point.weekLabel}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(0, barH)}
              rx={1}
              fill="var(--overview-metric-logged)"
              fillOpacity={0.88}
            />
            {valueLabel ? (
              <text
                x={cx}
                y={inside ? y + barH / 2 + 2 : y - 2}
                textAnchor="middle"
                dominantBaseline={inside ? 'middle' : 'auto'}
                fontSize={PROJECT_CHART_VALUE_FONT_PX}
                className={inside ? 'fill-background' : PROJECT_CHART_VALUE_CLASS}
              >
                {valueLabel}
              </text>
            ) : null}
            <text
              x={cx}
              y={labelY}
              fontSize={PROJECT_CHART_AXIS_FONT_PX}
              className={PROJECT_CHART_AXIS_CLASS}
              textAnchor="end"
              transform={`rotate(-90, ${cx}, ${labelY})`}
            >
              {point.weekLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
