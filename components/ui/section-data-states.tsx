import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'

export function SectionDataError({ message }: { message: string }) {
  return (
    <div
      className={cn(
        dashboardSurfaceClass('p-4'),
        'border border-destructive/30 bg-destructive/5 text-sm text-destructive'
      )}
      role="alert"
    >
      {message}
    </div>
  )
}

const DEFAULT_EMPTY_MONTHS_MESSAGE = (
  <>
    No historical months in <code className="font-mono text-xs">fact_capacity</code> yet. Run a
    sync, then refresh.
  </>
)

export const PROJECTS_EMPTY_MONTHS_MESSAGE =
  'No planning months available yet. Run a sync to populate project data.'

export function SectionEmptyState({ message }: { message?: ReactNode }) {
  return (
    <div className={cn(dashboardSurfaceClass('p-4'), 'text-sm text-muted-foreground')}>
      {message ?? DEFAULT_EMPTY_MONTHS_MESSAGE}
    </div>
  )
}
