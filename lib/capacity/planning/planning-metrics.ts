import { plannedPct } from '@/lib/domain/workload-metrics'
import { roundDisplayStat } from '@/lib/format/display-stats'

import type { PlanningNodeMetrics } from '@/lib/capacity/planning/planning-types'

export function buildPlanningNodeMetrics(
  netCapacityHours: number,
  plannedHours: number
): PlanningNodeMetrics {
  const net = roundDisplayStat(netCapacityHours)
  const planned = roundDisplayStat(plannedHours)
  const open = roundDisplayStat(net - planned)
  return {
    netCapacityHours: net,
    plannedHours: planned,
    openHours: open,
    utilizationPct: plannedPct(planned, net),
  }
}

export function sumPlanningNodeMetrics(
  items: readonly PlanningNodeMetrics[]
): PlanningNodeMetrics {
  const net = items.reduce((s, m) => s + m.netCapacityHours, 0)
  const planned = items.reduce((s, m) => s + m.plannedHours, 0)
  return buildPlanningNodeMetrics(net, planned)
}

export function mergeMonthMetricsMaps(
  maps: readonly Record<string, PlanningNodeMetrics>[]
): Record<string, PlanningNodeMetrics> {
  const keys = new Set<string>()
  for (const map of maps) {
    for (const key of Object.keys(map)) keys.add(key)
  }
  const out: Record<string, PlanningNodeMetrics> = {}
  for (const monthKey of keys) {
    const parts = maps
      .map((m) => m[monthKey])
      .filter((m): m is PlanningNodeMetrics => m != null)
    if (parts.length > 0) out[monthKey] = sumPlanningNodeMetrics(parts)
  }
  return out
}
