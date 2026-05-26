import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'
import type { PlanningMonthKpi } from '@/lib/capacity/planning/planning-types'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import { cn } from '@/lib/utils'

export function CapacityPlanningMonthKpiStrip({ monthKpis }: { monthKpis: PlanningMonthKpi[] }) {
  return (
    <section className="space-y-3" data-slot="capacity-planning-kpi-strip">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Period summary
      </p>
      <div
        className={cn(
          'grid gap-3',
          monthKpis.length <= 2 && 'sm:grid-cols-2',
          monthKpis.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
          monthKpis.length >= 4 && 'sm:grid-cols-2 xl:grid-cols-4'
        )}
      >
        {monthKpis.map((kpi) => (
          <MonthKpiCard key={kpi.monthKey} kpi={kpi} />
        ))}
      </div>
    </section>
  )
}

function MonthKpiCard({ kpi }: { kpi: PlanningMonthKpi }) {
  return (
    <article className={dashboardSurfaceClass('flex flex-col gap-3 p-3')}>
      <p className="text-sm font-medium text-foreground">{kpi.monthLabel}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <MetricItem label="Net capacity" value={fmtHoursKpi(kpi.netCapacityHours)} />
        <MetricItem label="Planned" value={fmtHoursKpi(kpi.plannedHours)} />
        <MetricItem
          label="Open"
          value={fmtHoursKpi(kpi.openHours)}
          className="text-emerald-600 dark:text-emerald-400"
        />
        <MetricItem
          label="Roles ≥ 90%"
          value={
            kpi.roleCount > 0
              ? `${kpi.rolesAtOrAbove90Pct}/${kpi.roleCount} (${fmtPct(kpi.rolesAbove90SharePct)})`
              : '—'
          }
        />
      </dl>
    </article>
  )
}

function MetricItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 font-mono text-sm font-semibold tabular-nums', className)}>
        {value}
      </dd>
    </div>
  )
}
