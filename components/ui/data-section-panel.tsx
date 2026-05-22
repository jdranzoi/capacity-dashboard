import type { ComponentProps, ReactNode } from 'react'

import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

export function DataSectionPanel({
  className,
  dataSlot,
  children,
  ...props
}: ComponentProps<'div'> & {
  dataSlot?: string
}) {
  return (
    <div
      data-slot={dataSlot ?? 'data-section-panel'}
      className={cn('flex flex-col', dashboardSurfaceClass(), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DataSectionPanelHeader({
  title,
  description,
  aside,
  titleClassName,
}: {
  title: string
  description?: ReactNode
  aside?: ReactNode
  titleClassName?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-foreground', titleClassName)}>{title}</p>
        {description ? (
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {aside}
    </div>
  )
}

export function DataSectionPanelTotalBadge({
  label,
  value,
  ariaLabel,
}: {
  label: string
  value: ReactNode
  ariaLabel: string
}) {
  return (
    <output
      className="shrink-0 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-right ring-1 ring-foreground/4"
      aria-label={ariaLabel}
    >
      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold tabular-nums leading-tight tracking-tight text-foreground">
        {value}
      </span>
    </output>
  )
}
