'use client'

import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export function SortableHeader<T>({
  column,
  align = 'left',
  title,
  children,
}: {
  column: Column<T, unknown>
  align?: 'left' | 'right'
  title?: string
  children: React.ReactNode
}) {
  const sorted = column.getIsSorted()
  const Icon = sorted === 'desc' ? ArrowDown : sorted === 'asc' ? ArrowUp : ArrowUpDown

  return (
    <button
      type="button"
      title={title}
      className={cn(
        '-mx-1 -my-0.5 inline-flex min-w-0 max-w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
        align === 'right' && 'ms-auto flex w-full justify-end text-right'
      )}
      onClick={column.getToggleSortingHandler()}
    >
      <span className="truncate">{children}</span>
      <Icon className={cn('size-3 shrink-0 opacity-40', sorted && 'opacity-90')} aria-hidden />
    </button>
  )
}
