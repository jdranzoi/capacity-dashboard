'use client'

import type { Column } from '@tanstack/react-table'

export function ColumnFilterInput<T>({
  column,
  ariaLabel,
}: {
  column: Column<T, unknown>
  ariaLabel?: string
}) {
  if (!column.getCanFilter()) {
    return <span className="block h-7 min-h-7" aria-hidden />
  }

  const val = (column.getFilterValue() as string) ?? ''
  const label = ariaLabel ?? `Filter column ${column.id}`

  return (
    <input
      type="search"
      value={val}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      className="h-7 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground"
      placeholder="Filter…"
      aria-label={label}
    />
  )
}
