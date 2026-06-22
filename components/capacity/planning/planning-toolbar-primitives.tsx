'use client'

import type { ReactNode } from 'react'

import type { SegmentedControlOption } from '@/components/ui/segmented-control'
import type { PlanningTreeExpansion } from '@/lib/capacity/planning/planning-grid-filters'
import { TOOLBAR_FIELD_LABEL_CLASS } from '@/lib/ui/toolbar-field-label'
import { cn } from '@/lib/utils'

export const PLANNING_TREE_OPTIONS: readonly SegmentedControlOption<PlanningTreeExpansion>[] = [
  { value: 'expand', label: 'Expand' },
  { value: 'collapse', label: 'Collapse' },
]

const fieldControlClass =
  'box-border h-8 w-full shrink-0 rounded-lg border border-border bg-muted/20 px-2.5 text-sm leading-none text-foreground ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function PlanningToolbarField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className={TOOLBAR_FIELD_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  );
}

export function PlanningToolbarSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <PlanningToolbarField label={label} className={cn('min-w-0', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldControlClass, 'appearance-none')}
      >
        {children}
      </select>
    </PlanningToolbarField>
  )
}

export function PlanningToolbarSearch({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <PlanningToolbarField label={label} className={cn('min-w-0', className)}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldControlClass, 'placeholder:text-muted-foreground')}
      />
    </PlanningToolbarField>
  )
}
