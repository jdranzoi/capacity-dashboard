import { cn } from '@/lib/utils'

import { CapacityOverviewRoleTable } from '@/components/capacity/overview/capacity-overview-role-table'
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'

export function CapacityOverviewRoleSummary({
  rows,
  className,
}: {
  rows: TeamRoleAnalyticsRow[]
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex min-h-0 flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10',
        className
      )}
      data-slot="capacity-overview-role-summary"
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">By role</p>
      <p className="mt-0.5 shrink-0 text-xs text-muted-foreground">
        Capacity fill, utilization, and planned share per role. Sort and filter per column.
      </p>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <CapacityOverviewRoleTable rows={rows} />
      </div>
    </section>
  )
}
