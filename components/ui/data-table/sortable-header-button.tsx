'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export type SortableHeaderDirection = 'asc' | 'desc'

/**
 * Sortable column header for hand-built tables (no TanStack Table).
 * Styling matches {@link SortableHeader}.
 */
export function SortableHeaderButton({
  label,
  active,
  direction,
  align = 'left',
  title,
  onClick,
}: {
  label: string
  active: boolean
  direction: SortableHeaderDirection | null
  align?: 'left' | 'right'
  title?: string
  onClick: () => void
}) {
  const Icon =
    direction === 'desc' ? ArrowDown : direction === 'asc' ? ArrowUp : ArrowUpDown

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        '-mx-1 -my-0.5 inline-flex min-w-0 max-w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
        align === 'right' && 'ms-auto flex w-full justify-end text-right'
      )}
    >
      <span className="truncate">{label}</span>
      <Icon className={cn('size-3 shrink-0 opacity-40', active && 'opacity-90')} aria-hidden />
    </button>
  )
}
