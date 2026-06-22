'use client'

import { format, startOfMonth } from 'date-fns'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { useResolvedSectionRoutePending } from "@/components/ui/use-resolved-section-route-pending";
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { cn } from '@/lib/utils'

const triggerClassName = cn(
  "flex h-9 w-full min-w-[11.5rem] items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 py-1.5 pr-2 pl-3 text-sm text-foreground",
  "ring-1 ring-foreground/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

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
  const routePending = useResolvedSectionRoutePending();
  const effectivePending = pendingNavigation ?? routePending
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

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
  const currentMonthKey = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM'), [])
  const selectedOption =
    options.find((option) => option.monthKey === selectedMonthKey) ?? options[0] ?? null

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (options.length === 0) {
    return null
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        id={`${listboxId}-trigger`}
        aria-label="Period"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-busy={isPending}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
        className={cn(triggerClassName, isPending ? 'cursor-wait opacity-80' : 'cursor-pointer')}
      >
        <span className="truncate">{selectedOption?.label ?? selectedMonthKey}</span>
        {isPending ? (
          <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        )}
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={`${listboxId}-trigger`}
          className="absolute top-[calc(100%+0.25rem)] z-50 max-h-64 w-full min-w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.monthKey === selectedMonthKey
            const isCurrentMonth = option.monthKey === currentMonthKey
            return (
              <li key={option.monthKey} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.monthKey);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/40",
                    isCurrentMonth && "bg-muted/55",
                    isSelected && "font-medium",
                  )}
                >
                  <Check
                    aria-hidden
                    className={cn(
                      "size-3.5 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  )
}
