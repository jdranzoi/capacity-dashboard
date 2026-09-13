'use client'

import { format } from 'date-fns'

import { fmtHeadcountKpi } from '@/lib/overview/overview-metrics'
import type { CapacityYearStackLayer } from '@/lib/capacity/overview/capacity-year-types'
import { cn } from '@/lib/utils'

const COUNT_AXIS_STEP = 5

function countAxisScale(maxValue: number): { domainMax: number; ticks: number[] } {
  const raw = Math.max(0, maxValue)
  let domainMax = Math.ceil(raw / COUNT_AXIS_STEP) * COUNT_AXIS_STEP
  if (domainMax < COUNT_AXIS_STEP) domainMax = COUNT_AXIS_STEP
  if (raw > 0 && domainMax === raw) domainMax += COUNT_AXIS_STEP
  const ticks: number[] = []
  for (let tick = 0; tick <= domainMax; tick += COUNT_AXIS_STEP) {
    ticks.push(tick)
  }
  return { domainMax, ticks }
}

export function CapacityYearStackChart({
  layers,
  throughMonthIndex,
  label,
  caption,
  compact = false,
}: {
  layers: CapacityYearStackLayer[]
  throughMonthIndex: number
  label: string
  caption?: string
  compact?: boolean
}) {
  const visibleMonths = throughMonthIndex + 1
  const totals = Array.from({ length: 12 }, (_, monthIndex) => {
    if (monthIndex > throughMonthIndex) return null
    let sum = 0
    let any = false
    for (const layer of layers) {
      const value = layer.points[monthIndex]?.value
      if (value != null) {
        any = true
        sum += value
      }
    }
    return any ? sum : null
  })
  const rawMax = Math.max(0, ...totals.filter((value): value is number => value != null))
  const { domainMax, ticks } = countAxisScale(rawMax)
  const padL = 44
  const padR = 10
  const padT = 10
  const padB = 22
  const plotW = 280
  const plotH = compact ? 100 : 148
  const width = padL + plotW + padR
  const height = padT + plotH + padB
  const xFor = (monthIndex: number) => padL + (monthIndex / 11) * plotW
  const yFor = (value: number) => padT + plotH - (value / domainMax) * plotH
  const barW = Math.min(16, plotW / 14)
  const monthTicks = [0, 3, 6, 9, 11]

  return (
    <div className={cn('mt-3 flex min-h-0 flex-col', compact ? 'flex-none' : 'flex-1')}>
      {caption ? (
        <p className="mb-1 text-[0.65rem] text-muted-foreground">{caption}</p>
      ) : null}
      {layers.length > 0 ? (
        <ol className="mb-1 flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-[0.65rem] text-muted-foreground">
          {layers.map((layer) => (
            <li key={layer.key} className="flex items-center gap-1">
              <span
                className="inline-block size-1.5 rounded-sm"
                style={{ background: layer.colorVar }}
              />
              <span>{layer.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <svg
        className={cn(
          'w-full text-[0.65rem] text-muted-foreground',
          compact
            ? 'min-h-[clamp(7rem,16vh,9.5rem)]'
            : 'min-h-[clamp(12rem,28vh,16rem)] flex-1 basis-0'
        )}
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
                opacity={tick === 0 ? 1 : isMajor ? 0.45 : 0.22}
              />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="currentColor">
                {fmtHeadcountKpi(tick)}
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
        {Array.from({ length: visibleMonths }, (_, monthIndex) => {
          let yCursor = padT + plotH
          const parts: { key: string; y: number; height: number; color: string }[] = []
          for (const layer of layers) {
            const value = layer.points[monthIndex]?.value ?? 0
            if (value <= 0) continue
            const heightPx = (value / domainMax) * plotH
            yCursor -= heightPx
            parts.push({
              key: layer.key,
              y: yCursor,
              height: heightPx,
              color: layer.colorVar,
            })
          }
          const total = totals[monthIndex]
          const tooltip = [
            format(new Date(2020, monthIndex, 1), 'MMM'),
            ...(total == null ? [] : [`${fmtHeadcountKpi(total)} total`]),
            ...layers.flatMap((layer) => {
              const value = layer.points[monthIndex]?.value
              if (value == null || value <= 0) return []
              return [`${layer.label} ${fmtHeadcountKpi(value)}`]
            }),
          ].join(' · ')
          const x = Math.max(padL, Math.min(xFor(monthIndex) - barW / 2, padL + plotW - barW))
          return (
            <g key={monthIndex}>
              <title>{tooltip}</title>
              {parts.map((part) => (
                <rect
                  key={part.key}
                  x={x}
                  y={part.y}
                  width={barW}
                  height={part.height}
                  fill={part.color}
                />
              ))}
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
      </svg>
    </div>
  )
}
