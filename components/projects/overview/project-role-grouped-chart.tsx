'use client'

import {
  PlannedLoggedBarLegend,
  PlannedLoggedProgressBar,
} from '@/components/projects/overview/planned-logged-progress-bar'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { projectOverrunHours } from '@/lib/domain/project-delivery-metrics'
import type { ProjectRoleHoursRow } from '@/lib/projects/overview/projects-types'
import { roleSortIndex } from '@/lib/domain/role-keys'

export type RoleGroupedRow = {
  roleKey: string
  roleLabel: string
  loggedHours: number
  plannedHours: number
}

export function mergeRoleHoursForChart(
  logged: readonly ProjectRoleHoursRow[],
  planned: readonly ProjectRoleHoursRow[]
): RoleGroupedRow[] {
  const byKey = new Map<string, RoleGroupedRow>()

  for (const row of logged) {
    byKey.set(row.roleKey, {
      roleKey: row.roleKey,
      roleLabel: row.roleLabel,
      loggedHours: row.hours,
      plannedHours: 0,
    })
  }
  for (const row of planned) {
    const existing = byKey.get(row.roleKey)
    if (existing) {
      existing.plannedHours = row.hours
    } else {
      byKey.set(row.roleKey, {
        roleKey: row.roleKey,
        roleLabel: row.roleLabel,
        loggedHours: 0,
        plannedHours: row.hours,
      })
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const orderCmp = roleSortIndex(a.roleKey) - roleSortIndex(b.roleKey)
    if (orderCmp !== 0) return orderCmp
    return a.roleLabel.localeCompare(b.roleLabel, 'en')
  })
}

export function ProjectRoleGroupedChart({
  rows,
  ariaLabel,
}: {
  rows: readonly RoleGroupedRow[]
  ariaLabel: string
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No role hours for this period.</p>
  }

  return (
    <div className="space-y-3" role="img" aria-label={ariaLabel}>
      <PlannedLoggedBarLegend />

      <ul className="list-none space-y-3 p-0">
        {rows.map((row) => {
          const overrunHours = projectOverrunHours(row.loggedHours, row.plannedHours)
          const planLabel =
            row.plannedHours > 0 ? fmtHoursKpi(row.plannedHours) : '—'

          return (
            <li key={row.roleKey}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="font-medium text-foreground">
                  {row.roleLabel}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {planLabel} plan · {fmtHoursKpi(row.loggedHours)} log
                </span>
              </div>
              <PlannedLoggedProgressBar
                plannedHours={row.plannedHours}
                loggedHours={row.loggedHours}
                overrunHours={overrunHours}
                trackClassName="h-3"
              />
            </li>
          );
        })}
      </ul>
    </div>
  )
}
