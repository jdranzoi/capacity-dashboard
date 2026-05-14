'use client'

import { useTeamRoutePending } from '@/components/team/team-route-pending-shell'
import type { TeamFilterSelectOption } from '@/lib/team/load-team-filter-options'
import { cn } from '@/lib/utils'
import { ChevronDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const ALL = ''

export function TeamFilterSelect({
  paramKey,
  label,
  options,
  selectedValue,
}: {
  paramKey: 'role' | 'zone' | 'project'
  label: string
  options: TeamFilterSelectOption[]
  selectedValue: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const teamPending = useTeamRoutePending()

  const value = selectedValue ?? ALL

  const onChange = useCallback(
    (next: string) => {
      const p = new URLSearchParams(searchParams.toString())
      if (next && next !== ALL) {
        p.set(paramKey, next)
      } else {
        p.delete(paramKey)
      }
      const q = p.toString()
      const href = q ? `${pathname}?${q}` : pathname
      if (teamPending) {
        teamPending.navigateWithTransition(href)
      } else {
        router.push(href, { scroll: false })
      }
    },
    [paramKey, pathname, router, searchParams, teamPending]
  )

  const isPending = teamPending?.isPending ?? false

  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        <select
          aria-label={`${label} filter`}
          aria-busy={isPending}
          value={value}
          disabled={isPending || options.length === 0}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 w-full appearance-none rounded-lg border border-border bg-muted/25 py-1.5 pr-8 pl-2.5 text-sm text-foreground',
            'ring-1 ring-foreground/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            options.length === 0 || isPending
              ? 'cursor-not-allowed opacity-70'
              : 'cursor-pointer'
          )}
        >
          <option value={ALL}>All</option>
          {options.map((o) => (
            <option key={`${paramKey}-${o.value}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {isPending ? (
          <Loader2
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : (
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
    </div>
  )
}
