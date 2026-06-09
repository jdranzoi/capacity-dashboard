'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PlannedUtilizationBandFilter } from '@/components/ui/planned-utilization-band-filter'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import {
  DEFAULT_PLANNED_UTILIZATION_BAND_AVAILABILITY,
  plannedUtilizationBandDescription,
  type PlannedUtilizationBand,
} from '@/lib/domain/planned-utilization-band'
import { shortMonthLabel } from '@/lib/capacity/planning/planning-month-visibility'
import type { PlanningUpcomingAvailabilityByBand } from '@/lib/capacity/planning/planning-types'
import { cn } from '@/lib/utils'

type AvailabilityMatrixRow = {
  roleCode: string
  roleLabel: string
  counts: Record<string, number>
}

type HeadcountTrend = 'up' | 'down' | 'flat'

function buildAvailabilityMatrix(
  events: PlanningUpcomingAvailabilityByBand[PlannedUtilizationBand],
  monthKeys: string[]
): AvailabilityMatrixRow[] {
  const byRole = new Map<string, { roleLabel: string; counts: Record<string, number> }>()

  for (const event of events) {
    let row = byRole.get(event.roleCode)
    if (!row) {
      row = { roleLabel: event.roleLabel, counts: {} }
      byRole.set(event.roleCode, row)
    }
    row.counts[event.monthKey] = event.headcount
  }

  return Array.from(byRole.entries())
    .map(([roleCode, { roleLabel, counts }]) => ({
      roleCode,
      roleLabel,
      counts: Object.fromEntries(monthKeys.map((monthKey) => [monthKey, counts[monthKey] ?? 0])),
    }))
    .sort((a, b) => {
      const maxA = Math.max(...Object.values(a.counts))
      const maxB = Math.max(...Object.values(b.counts))
      if (maxB !== maxA) return maxB - maxA
      return a.roleLabel.localeCompare(b.roleLabel, 'en', { sensitivity: 'base' })
    })
}

function headcountTrend(current: number, previous: number): HeadcountTrend {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'flat'
}

function trendLabel(trend: HeadcountTrend, current: number, previous: number): string {
  if (trend === 'up') return `up from ${previous} last month`
  if (trend === 'down') return `down from ${previous} last month`
  return `unchanged from ${previous} last month`
}

const TREND_ICON_CLASS: Record<HeadcountTrend, string> = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-blue-600 dark:text-blue-400',
}

function AvailabilityTrendIcon({ trend }: { trend: HeadcountTrend }) {
  const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
  return <Icon className={cn('size-3 shrink-0', TREND_ICON_CLASS[trend])} aria-hidden="true" />
}

export function CapacityPlanningUpcomingAvailabilityCard({
  availabilityByBand,
  monthKeys,
  monthLabels,
}: {
  availabilityByBand: PlanningUpcomingAvailabilityByBand
  monthKeys: string[]
  monthLabels: Record<string, string>
}) {
  const [utilBand, setUtilBand] = useState<PlannedUtilizationBand>(
    DEFAULT_PLANNED_UTILIZATION_BAND_AVAILABILITY
  )

  const bandDescription = plannedUtilizationBandDescription(utilBand)
  const events = availabilityByBand[utilBand]

  const matrixRows = useMemo(
    () => buildAvailabilityMatrix(events, monthKeys),
    [events, monthKeys]
  )

  const hasData = matrixRows.length > 0

  return (
    <DataSectionPanel dataSlot="capacity-planning-upcoming-availability" className="gap-3">
      <DataSectionPanelHeader
        title="Upcoming Availability"
        aside={
          <PlannedUtilizationBandFilter
            value={utilBand}
            onChange={setUtilBand}
            className="shrink-0"
          />
        }
      />

      {!hasData ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
          No roles match the utilization band in this period.
        </p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table
            className="w-full table-fixed border-collapse text-sm"
            aria-label={`Availability matrix: ${bandDescription}`}
          >
            <colgroup>
              <col />
              {monthKeys.map((monthKey) => (
                <col key={monthKey} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border/70">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-card px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Role
                </th>
                {monthKeys.map((monthKey) => (
                  <th
                    key={monthKey}
                    scope="col"
                    className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {shortMonthLabel(monthKey, monthLabels)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr
                  key={row.roleCode}
                  className="border-b border-border/40 last:border-b-0 transition-colors hover:bg-muted/15"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-normal"
                  >
                    <span
                      className="inline-flex rounded-md border border-border/80 bg-background px-2 py-0.5 font-mono text-[11px] font-semibold leading-none tracking-tight text-foreground"
                      title={row.roleLabel}
                    >
                      {row.roleCode}
                    </span>
                  </th>
                  {monthKeys.map((monthKey, monthIndex) => {
                    const count = row.counts[monthKey] ?? 0
                    const previousCount =
                      monthIndex > 0 ? (row.counts[monthKeys[monthIndex - 1]!] ?? 0) : null
                    const trend =
                      previousCount != null ? headcountTrend(count, previousCount) : null

                    return (
                      <td
                        key={monthKey}
                        className="px-2 py-2 text-center tabular-nums"
                        aria-label={
                          trend != null && previousCount != null
                            ? `${row.roleCode}, ${count} people in ${shortMonthLabel(monthKey, monthLabels)}, ${trendLabel(trend, count, previousCount)}`
                            : `${row.roleCode}, ${count} people in ${shortMonthLabel(monthKey, monthLabels)}`
                        }
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          <span
                            className={cn(
                              'text-sm',
                              count > 0 ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {count}
                          </span>
                          {trend != null ? (
                            <AvailabilityTrendIcon trend={trend} />
                          ) : (
                            <span className="inline-block size-3 shrink-0" aria-hidden="true" />
                          )}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="w-full text-[0.7rem] text-muted-foreground">{bandDescription}</p>
    </DataSectionPanel>
  )
}
