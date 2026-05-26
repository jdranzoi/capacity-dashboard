'use client'

import { shortMonthLabel } from '@/lib/capacity/planning/planning-month-visibility'
import { cn } from '@/lib/utils'

export function PlanningCompactMonthTabs({
  monthKeys,
  monthLabels,
  value,
  onChange,
  className,
}: {
  monthKeys: string[]
  monthLabels: Record<string, string>
  value: string
  onChange: (monthKey: string) => void
  className?: string
}) {
  if (monthKeys.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Filter by month"
      className={cn('flex flex-wrap gap-0.5 border-b border-border/70', className)}
    >
      {monthKeys.map((monthKey) => {
        const isActive = value === monthKey
        return (
          <button
            key={monthKey}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(monthKey)}
            className={cn(
              '-mb-px border-b-2 px-2 pb-1.5 pt-0.5 text-[11px] font-medium leading-none transition-colors',
              isActive
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {shortMonthLabel(monthKey, monthLabels)}
          </button>
        )
      })}
    </div>
  )
}
