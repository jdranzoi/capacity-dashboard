'use client'

import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { useOverviewRoutePending } from '@/components/overview/overview-route-pending-shell'
import { cn } from '@/lib/utils'
import { ChevronDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function OverviewMonthPicker({
  options,
  selectedMonthKey,
  className,
  /** When provided (e.g. `/team` route pending shell), overrides overview context. */
  pendingNavigation,
}: {
  options: OverviewMonthOption[]
  selectedMonthKey: string
  className?: string
  pendingNavigation?: {
    navigateWithTransition: (href: string) => void
    isPending: boolean
  } | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routePending = useOverviewRoutePending()
  const effectivePending = pendingNavigation ?? routePending

  const onChange = useCallback(
    (monthKey: string) => {
      const p = new URLSearchParams(searchParams.toString())
      if (monthKey) {
        p.set('month', monthKey)
      } else {
        p.delete('month')
      }
      const q = p.toString()
      const href = q ? `${pathname}?${q}` : pathname
      if (effectivePending) {
        effectivePending.navigateWithTransition(href)
      } else {
        router.push(href, { scroll: false })
      }
    },
    [effectivePending, pathname, router, searchParams]
  )

  const isPending = effectivePending?.isPending ?? false

  if (options.length === 0) {
    return null
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <select
        aria-label="Reference month"
        aria-busy={isPending}
        value={selectedMonthKey}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full min-w-[11.5rem] appearance-none rounded-lg border border-border bg-muted/25 py-1.5 pr-8 pl-3 text-sm text-foreground',
          'ring-1 ring-foreground/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isPending ? 'cursor-wait opacity-80' : 'cursor-pointer'
        )}
      >
        {options.map((o) => (
          <option key={o.monthKey} value={o.monthKey}>
            {o.label}
          </option>
        ))}
      </select>
      {isPending ? (
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
  )
}
