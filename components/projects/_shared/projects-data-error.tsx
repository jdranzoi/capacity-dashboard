import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'

export function ProjectsDataError({ message }: { message: string }) {
  return (
    <div
      className={cn(
        dashboardSurfaceClass('p-4'),
        'text-sm text-destructive'
      )}
      role="alert"
    >
      {message}
    </div>
  )
}

export function ProjectsEmptyMonths() {
  return (
    <div className={cn(dashboardSurfaceClass('p-4'), 'text-sm text-muted-foreground')}>
      No planning months available yet. Run a sync to populate project data.
    </div>
  )
}
