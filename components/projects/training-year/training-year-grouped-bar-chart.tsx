'use client'

import { useTrainingYearSelection } from '@/components/projects/training-year/use-training-year-selection'
import {
  formatAxisTick,
  formatBarValue,
  niceIntegerScale,
  yearFillOpacity,
} from '@/lib/projects/training-year/training-year-chart-math'
import type { TrainingYearGroupedChartSpec } from '@/lib/projects/training-year/training-year-types'
import { cn } from '@/lib/utils'

export function TrainingYearGroupedBarChart({
  chart,
  selectedKey,
}: {
  chart: TrainingYearGroupedChartSpec
  selectedKey: string | null
}) {
  const setSelection = useTrainingYearSelection()
  const rawMax = Math.max(0, ...chart.bars.flatMap((bar) => bar.values))
  const { domainMax, ticks } = niceIntegerScale(rawMax)
  const yearCount = Math.max(chart.years.length, 1)
  const padL = 44
  const padR = 10
  const padT = 16
  const padB = 24
  const groupW = yearCount <= 1 ? 36 : yearCount === 2 ? 46 : yearCount === 3 ? 54 : 60
  const gap = 1.25
  const barW =
    yearCount <= 1 ? 14 : Math.max(5, Math.floor((groupW - 8 - gap * (yearCount - 1)) / yearCount))
  const seriesWidth = yearCount * barW + Math.max(0, yearCount - 1) * gap
  const plotH = 132
  const width = padL + Math.max(chart.bars.length, 1) * groupW + padR
  const height = padT + plotH + padB
  const fill =
    chart.unit === 'hours' ? 'var(--overview-metric-logged)' : 'var(--overview-metric-billable)'
  const currentIndex = chart.years.indexOf(chart.currentYear)

  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10"
      data-slot={`training-year-chart-${chart.id}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-tight">{chart.title}</p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{chart.description}</p>
        </div>
        {yearCount > 1 ? (
          <ol className="flex shrink-0 flex-wrap justify-end gap-x-2 gap-y-1 text-[0.65rem] text-muted-foreground">
            {chart.years.map((year) => (
              <li key={year} className="flex items-center gap-1">
                <span
                  className={cn(
                    'inline-block size-2 rounded-xs',
                    chart.unit === 'hours'
                      ? 'bg-(--overview-metric-logged)'
                      : 'bg-(--overview-metric-billable)'
                  )}
                  style={{ opacity: yearFillOpacity(year, chart.currentYear, chart.years) }}
                />
                <span className={cn(year === chart.currentYear && 'font-medium text-foreground')}>
                  {year}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {chart.bars.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity in this slice.</p>
      ) : (
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <svg
            className="min-h-[clamp(8.5rem,20vh,13rem)] w-full flex-1 basis-0 text-[0.65rem] text-muted-foreground"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label={chart.title}
          >
            {ticks.map((tick) => {
              const y = padT + plotH - (tick / domainMax) * plotH
              return (
                <g key={tick}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={width - padR}
                    y2={y}
                    className="stroke-border"
                    strokeWidth={1}
                    opacity={tick === 0 ? 1 : 0.45}
                  />
                  <text x={padL - 6} y={y + 3} textAnchor="end" fill="currentColor">
                    {formatAxisTick(chart.unit, tick)}
                  </text>
                </g>
              )
            })}
            {chart.bars.map((bar, index) => {
              const hitX = padL + index * groupW
              const groupX = hitX + (groupW - seriesWidth) / 2
              const selected = selectedKey === bar.key
              const tooltip = [
                bar.title ?? bar.label,
                ...chart.years.map((year, yearIndex) => {
                  return `${year} ${formatBarValue(chart.unit, bar.values[yearIndex] ?? 0)}`
                }),
              ].join(' · ')
              const currentValue = currentIndex >= 0 ? (bar.values[currentIndex] ?? 0) : 0
              const currentX =
                currentIndex >= 0 ? groupX + currentIndex * (barW + gap) + barW / 2 : groupX + seriesWidth / 2
              return (
                <g key={bar.key}>
                  <rect
                    x={hitX}
                    y={padT}
                    width={groupW}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => setSelection(chart.paramKey, bar.key, selectedKey)}
                  >
                    <title>{tooltip}</title>
                  </rect>
                  {chart.years.map((year, yearIndex) => {
                    const value = bar.values[yearIndex] ?? 0
                    const bh = Math.max(0, (value / domainMax) * plotH)
                    const x = groupX + yearIndex * (barW + gap)
                    const y = padT + plotH - bh
                    return (
                      <rect
                        key={year}
                        x={x}
                        y={y}
                        width={barW}
                        height={bh}
                        rx={1.25}
                        fill={fill}
                        opacity={
                          selected || !selectedKey
                            ? yearFillOpacity(year, chart.currentYear, chart.years)
                            : 0.2
                        }
                        className="pointer-events-none"
                      />
                    )
                  })}
                  {currentValue > 0 ? (
                    <text
                      x={currentX}
                      y={Math.max(
                        padT + 8,
                        padT + plotH - (currentValue / domainMax) * plotH - 4
                      )}
                      textAnchor="middle"
                      fill="currentColor"
                      className="pointer-events-none tabular-nums"
                    >
                      {formatBarValue(chart.unit, currentValue)}
                    </text>
                  ) : null}
                  <text
                    x={padL + index * groupW + groupW / 2}
                    y={height - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    className={cn(selected && 'font-medium text-foreground')}
                  >
                    {bar.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
