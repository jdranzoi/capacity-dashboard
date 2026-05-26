'use client'

import { useCallback } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCapacityRoutePending } from '@/components/capacity/_shared/capacity-route-pending-shell'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { cn } from '@/lib/utils'

function PeriodSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: string
  options: OverviewMonthOption[]
  disabled: boolean
  onChange: (monthKey: string) => void
}) {
  return (
    <DashboardFilterField label={label} className="min-w-[9.5rem]">
      <div className="relative inline-flex w-full">
        <select
          aria-label={label}
          aria-busy={disabled}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 w-full appearance-none rounded-lg border border-border bg-muted/25 py-1.5 pr-8 pl-3 text-sm text-foreground',
            'ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            disabled ? 'cursor-wait opacity-80' : 'cursor-pointer'
          )}
        >
          {options.map((o) => (
            <option key={o.monthKey} value={o.monthKey}>
              {o.label}
            </option>
          ))}
        </select>
        {disabled ? (
          <Loader2
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : (
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
    </DashboardFilterField>
  )
}

export function CapacityPlanningPeriodPicker({
  options,
  fromMonthKey,
  toMonthKey,
}: {
  options: OverviewMonthOption[]
  fromMonthKey: string
  toMonthKey: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pending = useCapacityRoutePending()

  const chron = [...options].sort((a, b) => a.monthKey.localeCompare(b.monthKey))

  const navigate = useCallback(
    (nextFrom: string, nextTo: string) => {
      const p = new URLSearchParams(searchParams.toString())
      p.set('from', nextFrom)
      p.set('to', nextTo)
      const href = `${pathname}?${p.toString()}`
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [pathname, pending, router, searchParams]
  )

  const isPending = pending?.isPending ?? false

  if (chron.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-2">
      <PeriodSelect
        label="From"
        value={fromMonthKey}
        options={chron}
        disabled={isPending}
        onChange={(monthKey) => {
          const to = monthKey > toMonthKey ? monthKey : toMonthKey
          navigate(monthKey, to)
        }}
      />
      <span className="hidden pb-2 text-sm text-muted-foreground sm:inline" aria-hidden>
        →
      </span>
      <PeriodSelect
        label="To"
        value={toMonthKey}
        options={chron.filter((o) => o.monthKey >= fromMonthKey)}
        disabled={isPending}
        onChange={(monthKey) => navigate(fromMonthKey, monthKey)}
      />
    </div>
  )
}
