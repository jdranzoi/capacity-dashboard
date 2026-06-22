'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PlanningGridToolbarShell({
  children,
  trailing,
  className,
}: {
  children: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between border-b border-border/70 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
        {children}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-end self-end">{trailing}</div>
      ) : null}
    </div>
  );
}
