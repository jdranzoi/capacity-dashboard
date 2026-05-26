'use client'

import { PLANNING_TOOLBAR_LABEL_CLASS } from '@/components/capacity/planning/planning-toolbar-primitives'
import { cn } from '@/lib/utils'

export type PlanningSegmentOption<T extends string> = {
  value: T
  label: string
}

export function PlanningSegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: readonly PlanningSegmentOption<T>[]
  className?: string
}) {
  return (
    <fieldset className={cn('flex flex-col gap-1', className)}>
      <legend className={PLANNING_TOOLBAR_LABEL_CLASS}>{label}</legend>
      <div className="flex min-h-8 items-center rounded-lg border border-border bg-muted/20 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium leading-none transition-colors',
              value === option.value
                ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
