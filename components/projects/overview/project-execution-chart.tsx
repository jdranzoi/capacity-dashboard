'use client'

import { format, parse } from 'date-fns'

import {
  PROJECT_CHART_AXIS_CLASS,
  PROJECT_CHART_AXIS_FONT_PX,
  PROJECT_CHART_LEGEND_CLASS,
  PROJECT_CHART_VALUE_CLASS,
  PROJECT_CHART_VALUE_FONT_PX,
  formatBarHoursLabel,
  formatYAxisTickHours,
} from '@/components/projects/overview/project-chart-styles'
import type {
  ProjectExecutionGranularity,
  ProjectExecutionPoint,
} from '@/lib/projects/overview/projects-types'

function axisMax(value: number): number {
  if (value <= 0) return 8
  return Math.ceil(value / 20) * 20 || 20
}

function shortPeriodLabel(periodKey: string, periodLabel: string, granularity: ProjectExecutionGranularity): string {
  if (granularity === 'day') return periodLabel
  try {
    return format(parse(periodKey, 'yyyy-MM-dd', new Date()), "MMM ''yy")
  } catch {
    return periodLabel.replace(/\s20\d{2}$/, '')
  }
}

function labelStep(count: number, granularity: ProjectExecutionGranularity): number {
  if (count <= 8) return 1
  if (granularity === 'month') return Math.max(1, Math.ceil(count / 6))
  return Math.max(1, Math.ceil(count / 10))
}

function BarHoursLabel({
  hours,
  barX,
  barW,
  barTopY,
  barHeight,
}: {
  hours: number
  barX: number
  barW: number
  barTopY: number
  barHeight: number
}) {
  const label = formatBarHoursLabel(hours)
  if (!label) return null

  const cx = barX + barW / 2
  const inside = barHeight > 0 && barHeight < 14
  const y = inside ? barTopY + barHeight / 2 + 2 : barTopY - 2

  return (
    <text
      x={cx}
      y={y}
      textAnchor="middle"
      dominantBaseline={inside ? 'middle' : 'auto'}
      fontSize={PROJECT_CHART_VALUE_FONT_PX}
      className={inside ? 'fill-background' : PROJECT_CHART_VALUE_CLASS}
    >
      {label}
    </text>
  )
}

export function ProjectExecutionChart({
  series,
  granularity,
  ariaLabel,
}: {
  series: readonly ProjectExecutionPoint[]
  granularity: ProjectExecutionGranularity
  ariaLabel: string
}) {
  if (series.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No execution history for this project.</p>
    )
  }

  const w = granularity === 'day' ? 360 : 400
  const padL = 32
  const padR = 8
  const padT = 14
  const padB = 40
  const plotW = w - padL - padR
  const plotH = 118 - padT
  const h = padT + plotH + padB
  const axisBaselineY = padT + plotH

  const maxY = axisMax(
    Math.max(...series.flatMap((p) => [p.plannedHours, p.loggedHours]))
  )
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxY / tickCount) * i)
  const toY = (hours: number) => padT + plotH - (hours / maxY) * plotH

  const n = series.length
  const groupSlotW = plotW / n
  const pairW = Math.min(groupSlotW * 0.72, granularity === 'day' ? 14 : 28)
  const barW = Math.max(2, (pairW - 2) / 2)
  const step = labelStep(n, granularity)

  return (
    <div className="space-y-1.5">
      <div className={`flex flex-wrap items-center gap-3 ${PROJECT_CHART_LEGEND_CLASS}`}>
        <span className="inline-flex items-center gap-1">
          <span
            className="size-2 rounded-sm bg-[var(--overview-metric-planned)] opacity-55"
            aria-hidden
          />
          Planned
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="size-2 rounded-sm bg-[var(--overview-metric-logged)]"
            aria-hidden
          />
          Logged
        </span>
      </div>

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

        {series.map((point, i) => {
          const groupCx = padL + groupSlotW * i + groupSlotW / 2
          const plannedX = groupCx - barW - 1
          const loggedX = groupCx + 1
          const plannedH = (point.plannedHours / maxY) * plotH
          const loggedH = (point.loggedHours / maxY) * plotH
          const showPeriodLabel = i === 0 || i === n - 1 || i % step === 0
          const showValueLabels = granularity === 'month' || showPeriodLabel

          const plannedTop = axisBaselineY - plannedH
          const loggedTop = axisBaselineY - loggedH

          return (
            <g key={point.periodKey}>
              {point.plannedHours > 0 ? (
                <rect
                  x={plannedX}
                  y={plannedTop}
                  width={barW}
                  height={Math.max(0, plannedH)}
                  rx={1}
                  fill="var(--overview-metric-planned)"
                  fillOpacity={0.55}
                />
              ) : null}
              {point.loggedHours > 0 ? (
                <rect
                  x={loggedX}
                  y={loggedTop}
                  width={barW}
                  height={Math.max(0, loggedH)}
                  rx={1}
                  fill="var(--overview-metric-logged)"
                  fillOpacity={0.9}
                />
              ) : null}
              {showValueLabels && point.plannedHours > 0 ? (
                <BarHoursLabel
                  hours={point.plannedHours}
                  barX={plannedX}
                  barW={barW}
                  barTopY={plannedTop}
                  barHeight={plannedH}
                />
              ) : null}
              {showValueLabels && point.loggedHours > 0 ? (
                <BarHoursLabel
                  hours={point.loggedHours}
                  barX={loggedX}
                  barW={barW}
                  barTopY={loggedTop}
                  barHeight={loggedH}
                />
              ) : null}
              {showPeriodLabel ? (
                <text
                  x={groupCx}
                  y={axisBaselineY + 2}
                  fontSize={PROJECT_CHART_AXIS_FONT_PX}
                  className={PROJECT_CHART_AXIS_CLASS}
                  textAnchor="end"
                  transform={`rotate(-90, ${groupCx}, ${axisBaselineY + 2})`}
                >
                  {shortPeriodLabel(point.periodKey, point.periodLabel, granularity)}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
