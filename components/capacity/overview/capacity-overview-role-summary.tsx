import { cn } from '@/lib/utils'

import { RoleAnalyticsTable } from '@/components/capacity/_shared/role-analytics-table'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import type { RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'

export function CapacityOverviewRoleSummary({
  rows,
  className,
}: {
  rows: RoleAnalyticsRow[]
  className?: string
}) {
  return (
    <section
      className={cn('flex min-h-0 flex-col', dashboardSurfaceClass(), className)}
      data-slot="capacity-overview-role-summary"
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">By role</p>
      <p className="mt-0.5 shrink-0 text-xs text-muted-foreground">
        Capacity fill, utilization, and planned share per role. Sort and filter per column.
      </p>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <RoleAnalyticsTable rows={rows} wrapperClassName="h-full" />
      </div>
    </section>
  )
}
