'use client'

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CapacityPlanningAvailablePeopleLoading } from '@/components/capacity/planning/capacity-planning-available-people-loading'
import { FragmentationLabelBadge } from '@/components/ui/fragmentation-label-badge'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'
import type { PlanningAvailablePerson, PlanningPeriod } from '@/lib/capacity/planning/planning-types'
import { PLANNING_MIN_AVAILABILITY_HOURS } from '@/lib/capacity/planning/planning-available-people-filters'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { cn } from '@/lib/utils'

export function CapacityPlanningAvailablePeopleCard({
  people,
  period,
  selectedMonthKey,
  selectedRole,
  minAvailability,
  roleOptions,
}: {
  people: PlanningAvailablePerson[]
  period: PlanningPeriod
  selectedMonthKey: string
  selectedRole: string
  minAvailability: number
  roleOptions: string[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localMin, setLocalMin] = useState(String(minAvailability))
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setLocalMin(String(minAvailability))
  }, [minAvailability])

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') p.delete(key)
        else p.set(key, value)
      }
      startTransition(() => {
        router.push(`${pathname}?${p.toString()}`, { scroll: false })
      })
    },
    [pathname, router, searchParams, startTransition]
  )

  const monthOptions = useMemo(
    () => period.monthKeys.map((k) => ({ key: k, label: period.monthLabels[k] ?? k })),
    [period]
  )

  return (
    <DataSectionPanel dataSlot="capacity-planning-available-people" className="gap-3">
      <DataSectionPanelHeader
        title="Available People"
        description="Identify open capacity for staffing decisions."
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <FilterField label="Month">
          <select
            aria-label="Filter available people by month"
            value={selectedMonthKey}
            disabled={isPending}
            onChange={(e) => pushParams({ peopleMonth: e.target.value })}
            className={filterSelectClass}
          >
            {monthOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Role">
          <select
            aria-label="Filter available people by role"
            value={selectedRole}
            disabled={isPending}
            onChange={(e) => pushParams({ peopleRole: e.target.value || null })}
            className={filterSelectClass}
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Min availability">
          <select
            aria-label="Minimum availability hours"
            value={localMin}
            disabled={isPending}
            onChange={(e) => {
              setLocalMin(e.target.value)
              pushParams({ minAvail: e.target.value })
            }}
            className={filterSelectClass}
          >
            {PLANNING_MIN_AVAILABILITY_HOURS.map((h) => (
              <option key={h} value={String(h)}>
                ≥ {h}h
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      <div className="relative min-h-32" aria-busy={isPending}>
        {isPending ? (
          <CapacityPlanningAvailablePeopleLoading listOnly />
        ) : (
          <ul className="space-y-1">
            {people.length === 0 ? (
              <li className="rounded-md border border-dashed border-border px-2.5 py-4 text-center text-xs text-muted-foreground">
                No people match the current filters.
              </li>
            ) : (
              people.slice(0, 8).map((person) => (
                <li
                  key={person.personId}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/10 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-xs font-medium text-foreground">
                      {person.personName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {person.roleLabel}
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtHoursKpi(person.availableHours)} avail
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {person.projectCount}{' '}
                        {person.projectCount === 1 ? 'project' : 'projects'}
                      </span>
                    </p>
                  </div>
                  <FragmentationLabelBadge label={person.fragmentationLabel} />
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </DataSectionPanel>
  )
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

const filterSelectClass = cn(
  'h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground',
  'ring-1 ring-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
)
