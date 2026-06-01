'use client'

import type { ReactNode } from 'react'

import type { PlanningSegmentOption } from '@/components/capacity/planning/planning-segmented-control'
import type { PlanningTreeExpansion } from '@/lib/capacity/planning/planning-grid-filters'
import { cn } from '@/lib/utils'

export const PLANNING_TREE_OPTIONS: readonly PlanningSegmentOption<PlanningTreeExpansion>[] = [
  { value: 'expand', label: 'Expand' },
  { value: 'collapse', label: 'Collapse' },
]

/** Shared with Projects Overview space-type filter (same values as Capacity Planning project grid). */
export const PLANNING_PROJECT_TYPE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'build' as const, label: 'Build' },
  { value: 'support' as const, label: 'Support' },
  { value: 'internal' as const, label: 'Internal' },
]

export const PLANNING_TOOLBAR_LABEL_CLASS =
  'block h-3.5 shrink-0 text-[10px] font-medium uppercase leading-none tracking-wide text-muted-foreground'

/** Fixed slot for Role select vs person name search so toolbar layout does not shift. */
export const PLANNING_ROLE_NAME_FILTER_WIDTH = 'w-44 shrink-0'

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
    <div className={cn('flex flex-col gap-1', className)}>
      <span className={PLANNING_TOOLBAR_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
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
