import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function DashboardFilterField({
  label,
  children,
  hint,
  className,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-[9.5rem] flex-col gap-1', className)}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <div className="text-[0.7rem] text-muted-foreground tabular-nums">{hint}</div> : null}
    </div>
  )
}
