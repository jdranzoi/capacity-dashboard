'use client'

import { useEffect, useMemo, useState } from 'react'

import { PlanningCompactMonthTabs } from '@/components/capacity/planning/planning-compact-month-tabs'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import { PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT } from '@/lib/capacity/planning/planning-upcoming-availability-config'
import type { PlanningAvailabilityEvent } from '@/lib/capacity/planning/planning-types'
import { cn } from '@/lib/utils'

function formatHeadcount(count: number): string {
  return count === 1 ? '1 person' : `${count} people`
}

export function CapacityPlanningUpcomingAvailabilityCard({
  events,
  monthKeys,
  monthLabels,
}: {
  events: PlanningAvailabilityEvent[]
  monthKeys: string[]
  monthLabels: Record<string, string>
}) {
  const monthsWithEvents = useMemo(() => {
    const withEvents = new Set(events.map((e) => e.monthKey))
    return monthKeys.filter((key) => withEvents.has(key))
  }, [events, monthKeys])

  const [activeMonthKey, setActiveMonthKey] = useState(() => monthsWithEvents[0] ?? '')

  useEffect(() => {
    if (monthsWithEvents.length === 0) {
      setActiveMonthKey('')
      return
    }
    if (!monthsWithEvents.includes(activeMonthKey)) {
      setActiveMonthKey(monthsWithEvents[0]!)
    }
  }, [activeMonthKey, monthsWithEvents])

  const resolvedMonthKey = monthsWithEvents.includes(activeMonthKey)
    ? activeMonthKey
    : (monthsWithEvents[0] ?? '')

  const visibleEvents = useMemo(
    () => (resolvedMonthKey ? events.filter((e) => e.monthKey === resolvedMonthKey) : []),
    [events, resolvedMonthKey]
  )

  return (
    <DataSectionPanel dataSlot="capacity-planning-upcoming-availability" className="gap-3">
      <DataSectionPanelHeader
        title="Upcoming Availability"
        description={`Roles with people under ${PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT}% planned utilization (plan ÷ net).`}
      />

      {monthsWithEvents.length > 0 ? (
        <PlanningCompactMonthTabs
          monthKeys={monthsWithEvents}
          monthLabels={monthLabels}
          value={resolvedMonthKey}
          onChange={setActiveMonthKey}
        />
      ) : null}

      {visibleEvents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
          {monthsWithEvents.length === 0
            ? 'No roles under the utilization threshold in this period.'
            : 'No roles under the threshold for this month.'}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5" role="list">
          {visibleEvents.map((event) => (
            <div
              key={`${event.monthKey}-${event.roleCode}`}
              role="listitem"
              aria-label={`${event.roleCode}, ${formatHeadcount(event.headcount)} below ${PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT} percent planned utilization`}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border border-border/70',
                'bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/20'
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="shrink-0 rounded-md border border-border/80 bg-background px-2 py-0.5 font-mono text-[11px] font-semibold leading-none tracking-tight text-foreground"
                  title={event.roleLabel}
                >
                  {event.roleCode}
                </span>
                <span className="truncate text-sm text-foreground">
                  {formatHeadcount(event.headcount)}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                &lt;{PLANNING_UPCOMING_MAX_PLANNED_UTIL_PCT}% util
              </span>
            </div>
          ))}
        </div>
      )}
    </DataSectionPanel>
  )
}
