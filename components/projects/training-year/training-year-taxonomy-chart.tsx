'use client'

import { useTrainingYearSelection } from '@/components/projects/training-year/use-training-year-selection'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { niceIntegerScale } from '@/lib/projects/training-year/training-year-chart-math'
import type {
  TrainingYearTaxonomyChartSpec,
  TrainingYearTaxonomyRow,
} from '@/lib/projects/training-year/training-year-types'
import { cn } from '@/lib/utils'

export type TrainingYearTaxonomyUnit = 'hours' | 'share'

const LABEL_MAX_CHARS = 28

function truncateLabel(label: string): string {
  return label.length <= LABEL_MAX_CHARS ? label : `${label.slice(0, LABEL_MAX_CHARS - 1)}…`
}

function currentValue(row: TrainingYearTaxonomyRow, unit: TrainingYearTaxonomyUnit): number {
  return unit === 'hours' ? row.currentHours : row.currentSharePct
}

function priorValue(row: TrainingYearTaxonomyRow, unit: TrainingYearTaxonomyUnit): number {
  return unit === 'hours' ? row.priorHours : row.priorSharePct
}

function formatValue(unit: TrainingYearTaxonomyUnit, value: number): string {
  return unit === 'hours' ? fmtHoursKpi(value) : fmtPct(value)
}

export function TrainingYearTaxonomyChart({
  chart,
  unit,
  selectedKey,
}: {
  chart: TrainingYearTaxonomyChartSpec
  unit: TrainingYearTaxonomyUnit
  selectedKey: string | null
}) {
  const setSelection = useTrainingYearSelection()
  const rawMax = Math.max(
    0,
    ...chart.rows.map((row) => Math.max(currentValue(row, unit), priorValue(row, unit)))
  )
  const { domainMax, ticks } = niceIntegerScale(rawMax)

  const padL = 168
  const padR = 48
  const padT = 8
  const padB = 22
  const barH = 13
  const barGap = 3
  const rowGap = 11
  const barBlockH = barH * 2 + barGap
  const rowH = barBlockH + rowGap
  const width = 620
  const plotW = width - padL - padR
  const plotH = Math.max(rowH, chart.rows.length * rowH)
  const height = padT + plotH + padB

  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10"
      data-slot={`training-year-taxonomy-${chart.id}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-tight">{chart.title}</p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{chart.description}</p>
        </div>
        {chart.priorYear != null ? (
          <ol className="flex shrink-0 gap-x-2 text-[0.65rem] text-muted-foreground">
            <li className="flex items-center gap-1">
              <span
                className="inline-block size-2 rounded-xs bg-(--overview-metric-logged)"
                style={{ opacity: 0.92 }}
              />
              <span className="font-medium text-foreground">{chart.currentYear}</span>
            </li>
            <li className="flex items-center gap-1">
              <span
                className="inline-block size-2 rounded-xs bg-(--overview-metric-logged)"
                style={{ opacity: 0.4 }}
              />
              <span>{chart.priorYear}</span>
            </li>
          </ol>
        ) : null}
      </div>

      {chart.rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No hours in this slice.</p>
      ) : (
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          {/* Height comes from the row count, so bars keep a legible thickness. */}
          <svg
            className="h-auto w-full text-[0.65rem] text-muted-foreground"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label={`${chart.title} — ${chart.description}`}
          >
            {ticks.map((tick) => {
              const x = padL + (tick / domainMax) * plotW
              return (
                <g key={tick}>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={padT + plotH}
                    className="stroke-border"
                    strokeWidth={1}
                    opacity={tick === 0 ? 1 : 0.45}
                  />
                  <text x={x} y={height - 5} textAnchor="middle" fill="currentColor">
                    {formatValue(unit, tick)}
                  </text>
                </g>
              )
            })}

            {chart.rows.map((row, index) => {
              const rowY = padT + index * rowH
              const selected = selectedKey === row.key
              const dimmed = selectedKey != null && !selected
              const current = currentValue(row, unit)
              const prior = priorValue(row, unit)
              const tooltip = [
                row.label,
                `${chart.currentYear} ${formatValue(unit, current)}`,
                chart.priorYear == null
                  ? null
                  : `${chart.priorYear} ${formatValue(unit, prior)}`,
              ]
                .filter(Boolean)
                .join(' · ')
              const currentW = domainMax > 0 ? (current / domainMax) * plotW : 0
              const priorW = domainMax > 0 ? (prior / domainMax) * plotW : 0

              return (
                <g key={row.key}>
                  <rect
                    x={0}
                    y={rowY}
                    width={width}
                    height={rowH}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => setSelection(chart.paramKey, row.key, selectedKey)}
                  >
                    <title>{tooltip}</title>
                  </rect>
                  <text
                    x={padL - 8}
                    y={rowY + barBlockH / 2 + 3.5}
                    textAnchor="end"
                    fill="currentColor"
                    className={cn(
                      'pointer-events-none',
                      selected && 'font-medium text-foreground',
                      dimmed && 'opacity-55'
                    )}
                  >
                    {truncateLabel(row.label)}
                  </text>
                  <rect
                    x={padL}
                    y={rowY}
                    width={Math.max(0, currentW)}
                    height={barH}
                    rx={1.25}
                    fill="var(--overview-metric-logged)"
                    opacity={dimmed ? 0.2 : 0.92}
                    className="pointer-events-none"
                  />
                  {chart.priorYear == null ? null : (
                    <rect
                      x={padL}
                      y={rowY + barH + barGap}
                      width={Math.max(0, priorW)}
                      height={barH}
                      rx={1.25}
                      fill="var(--overview-metric-logged)"
                      opacity={dimmed ? 0.12 : 0.4}
                      className="pointer-events-none"
                    />
                  )}
                  {current > 0 ? (
                    <text
                      x={padL + currentW + 5}
                      y={rowY + barH / 2 + 3.5}
                      fill="currentColor"
                      className={cn(
                        'pointer-events-none tabular-nums',
                        selected && 'font-medium text-foreground',
                        dimmed && 'opacity-55'
                      )}
                    >
                      {formatValue(unit, current)}
                    </text>
                  ) : null}
                </g>
              )
            })}

            <line
              x1={padL}
              y1={padT}
              x2={padL}
              y2={padT + plotH}
              className="stroke-border"
              strokeWidth={1}
            />
          </svg>
        </div>
      )}
    </div>
  )
}
