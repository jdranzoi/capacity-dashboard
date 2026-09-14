'use client'

import { useState } from 'react'
import { format } from 'date-fns'

import { CapacityYearHoverTip } from '@/components/capacity/overview/capacity-year-hover-tip'
import { niceIntegerScale } from '@/lib/projects/training-year/training-year-chart-math'
import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { CapacityYearKpiKind, CapacityYearSeries } from '@/lib/capacity/overview/capacity-year-types'
import { yearCompareColorVar } from '@/lib/ui/year-compare-colors'
import { cn } from '@/lib/utils'

type HoveredPoint = {
  year: number
  monthIndex: number
  value: number
  x: number
  y: number
}

function formatTick(kind: CapacityYearKpiKind, value: number): string {
  if (kind === 'pct') return fmtPct(value)
  if (kind === 'count') return fmtHeadcountKpi(value)
  if (value === 0) return '0h'
  return fmtHoursKpi(value)
}

const COUNT_AXIS_STEP = 5

function focusedCountScale(values: number[]): { domainMin: number; domainMax: number; ticks: number[] } {
  const dataMin = values.length > 0 ? Math.min(...values) : 0
  const dataMax = values.length > 0 ? Math.max(...values) : COUNT_AXIS_STEP
  let domainMin = Math.floor(dataMin / COUNT_AXIS_STEP) * COUNT_AXIS_STEP
  let domainMax = Math.ceil(dataMax / COUNT_AXIS_STEP) * COUNT_AXIS_STEP
  if (dataMin - domainMin < 2 && domainMin >= COUNT_AXIS_STEP) {
    domainMin -= COUNT_AXIS_STEP
  }
  if (domainMax - dataMax < 2) {
    domainMax += COUNT_AXIS_STEP
  }
  if (domainMax <= domainMin) {
    domainMax = domainMin + COUNT_AXIS_STEP
  }
  const ticks: number[] = []
  for (let tick = domainMin; tick <= domainMax; tick += COUNT_AXIS_STEP) {
    ticks.push(tick)
  }
  return { domainMin, domainMax, ticks }
}

function polylinePoints(
  series: CapacityYearSeries,
  xFor: (monthIndex: number) => number,
  yFor: (value: number) => number
): string {
  return series.points
    .filter((point) => point.value != null)
    .map((point) => `${xFor(point.monthIndex)},${yFor(point.value as number)}`)
    .join(' ')
}

const PCT_AXIS_STEP = 5

function focusedPctScale(
  values: number[],
  focus: { min: number; max: number }
): { domainMin: number; domainMax: number; ticks: number[] } {
  const dataMin = values.length > 0 ? Math.min(...values) : focus.min
  const dataMax = values.length > 0 ? Math.max(...values) : focus.max
  const domainMin = Math.min(focus.min, Math.floor(dataMin / PCT_AXIS_STEP) * PCT_AXIS_STEP)
  const domainMax = Math.max(focus.max, Math.ceil(dataMax / PCT_AXIS_STEP) * PCT_AXIS_STEP)
  const ticks: number[] = []
  for (let tick = domainMin; tick <= domainMax; tick += PCT_AXIS_STEP) {
    ticks.push(tick)
  }
  return { domainMin, domainMax, ticks }
}

export function CapacityYearLineChart({
  series,
  currentYear,
  kind,
  label,
  yFocus,
}: {
  series: CapacityYearSeries[]
  currentYear: number
  kind: CapacityYearKpiKind
  label: string
  yFocus?: { min: number; max: number }
}) {
  const years = series.map((item) => item.year)
  const values = series.flatMap((item) =>
    item.points.map((point) => point.value).filter((value): value is number => value != null)
  )
  const focused = kind === 'pct' && yFocus ? focusedPctScale(values, yFocus) : null
  const rawMax = Math.max(0, ...values)
  const countScale = kind === 'count' && !focused ? focusedCountScale(values) : null
  const zeroBased = focused || countScale ? null : niceIntegerScale(rawMax)
  const domainMin = focused?.domainMin ?? countScale?.domainMin ?? 0
  const domainMax = focused?.domainMax ?? countScale?.domainMax ?? zeroBased?.domainMax ?? 1
  const ticks = focused?.ticks ?? countScale?.ticks ?? zeroBased?.ticks ?? [0]
  const padL = 44
  const padR = 10
  const padT = 10
  const padB = 22
  const plotW = 280
  const plotH = 148
  const width = padL + plotW + padR
  const height = padT + plotH + padB
  const span = Math.max(domainMax - domainMin, 1)
  const xFor = (monthIndex: number) => padL + (monthIndex / 11) * plotW
  const yFor = (value: number) => padT + plotH - ((value - domainMin) / span) * plotH
  const monthTicks = [0, 3, 6, 9, 11]
  const [hovered, setHovered] = useState<HoveredPoint | null>(null)

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      {years.length > 1 ? (
        <ol className="mb-1 flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-[0.65rem] text-muted-foreground">
          {years.map((year) => (
            <li key={year} className="flex items-center gap-1">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: yearCompareColorVar(year, currentYear) }}
              />
              <span className={cn(year === currentYear && 'font-medium text-foreground')}>
                {year}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <svg
        className="min-h-[clamp(12rem,28vh,16rem)] w-full flex-1 basis-0 text-[0.65rem] text-muted-foreground"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMid meet"
        role="img"
        aria-label={`${label} by month`}
      >
        {ticks.map((tick) => {
          const y = yFor(tick)
          const isMajor = tick % 10 === 0
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
                opacity={tick === domainMin ? 1 : isMajor ? 0.45 : 0.22}
              />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="currentColor">
                {formatTick(kind, tick)}
              </text>
            </g>
          )
        })}
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const x = xFor(monthIndex)
          const isLabeled = monthTicks.includes(monthIndex)
          return (
            <line
              key={`month-${monthIndex}`}
              x1={x}
              y1={padT}
              x2={x}
              y2={padT + plotH}
              className="stroke-border"
              strokeWidth={1}
              opacity={isLabeled ? 0.55 : 0.28}
            />
          )
        })}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={width - padR}
          y2={padT + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        {series.map((item) => {
          const pts = polylinePoints(item, xFor, yFor)
          if (!pts) return null
          const color = yearCompareColorVar(item.year, currentYear)
          return (
            <g key={item.year}>
              <polyline
                fill="none"
                points={pts}
                style={{ stroke: color }}
                strokeWidth={item.year === currentYear ? 1.85 : 1.45}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {item.points.map((point) => {
                if (point.value == null) return null
                const x = xFor(point.monthIndex)
                const y = yFor(point.value)
                const active =
                  hovered?.year === item.year && hovered.monthIndex === point.monthIndex
                return (
                  <g key={`${item.year}-${point.monthIndex}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={active ? 3.1 : item.year === currentYear ? 2.2 : 1.9}
                      style={{ fill: color }}
                      className="pointer-events-none"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHovered({
                          year: item.year,
                          monthIndex: point.monthIndex,
                          value: point.value as number,
                          x,
                          y,
                        })
                      }
                      onMouseLeave={() => setHovered(null)}
                      aria-label={formatTick(kind, point.value)}
                    />
                  </g>
                )
              })}
            </g>
          )
        })}
        {monthTicks.map((monthIndex) => (
          <text
            key={monthIndex}
            x={xFor(monthIndex)}
            y={height - 4}
            textAnchor="middle"
            fill="currentColor"
          >
            {format(new Date(2020, monthIndex, 1), 'MMM')}
          </text>
        ))}
        {hovered ? (
          <CapacityYearHoverTip
            x={hovered.x}
            y={hovered.y}
            value={formatTick(kind, hovered.value)}
            chartWidth={width}
          />
        ) : null}
      </svg>
    </div>
  )
}
