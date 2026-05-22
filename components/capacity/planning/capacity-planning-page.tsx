import { connection } from 'next/server'
import { parse } from 'date-fns'

import {
  CapacityDataError,
  CapacityEmptyMonths,
} from '@/components/capacity/_shared/capacity-data-error'
import { CapacityPlanningKpiBlock } from '@/components/capacity/planning/capacity-planning-kpi-block'
import {
  PlanningProjectChart,
  PlanningRoleChart,
} from '@/components/capacity/planning/capacity-planning-charts-block'
import {
  PlanningHorizonChart,
  PlanningHorizonTable,
} from '@/components/capacity/planning/capacity-planning-horizon-block'
import { perfSpan } from '@/lib/dev/perf-log'
import { loadCapacityPlanning } from '@/lib/capacity/planning/load-capacity-planning'
import { loadCapacityHorizon } from '@/lib/capacity/planning/load-capacity-horizon'
import { getCapacityMonthContext } from '@/lib/capacity/shared/capacity-page-cache'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export async function CapacityPlanningPageBlock({
  monthStr,
  routeFilters,
}: {
  monthStr: string | undefined
  routeFilters: CapacityRouteFilters
}) {
  return perfSpan('capacity/planning', async () => {
    await connection()
    const ctx = await getCapacityMonthContext(monthStr, routeFilters)
    if (ctx.error) return <CapacityDataError message={ctx.error} />
    if (!ctx.data) return <CapacityEmptyMonths />

    const { selected, snapshot, personIds } = ctx.data

    const [planningResult, horizonResult] = await Promise.all([
      loadCapacityPlanning({
        monthStartStr: selected.monthStartStr,
        monthLabel: selected.label,
        snapshot,
        personIdFilter: personIds,
      }),
      loadCapacityHorizon(selected.monthKey),
    ])

    if (planningResult.error || !planningResult.data) {
      return (
        <CapacityDataError
          message={planningResult.error ?? 'Could not load planning data.'}
        />
      )
    }

    const planData = planningResult.data
    const horizonMonths = horizonResult.data?.months ?? []

    return (
      <div className="flex flex-col gap-8">
        {/* KPI row */}
        <CapacityPlanningKpiBlock data={planData} />

        {/* Section A: this month breakdown */}
        <section className="space-y-3" data-slot="capacity-planning-breakdown">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {selected.label} breakdown
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PlanningRoleChart rows={planData.byRole} className="min-h-[18rem]" />
            <PlanningProjectChart rows={planData.byProject} className="min-h-[18rem]" />
          </div>
        </section>

        {/* Section B: horizon view */}
        {horizonMonths.length > 0 && (
          <section className="space-y-3" data-slot="capacity-planning-horizon">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Capacity horizon
            </p>
            <div className="grid gap-4 lg:grid-cols-[3fr_4fr] lg:items-stretch">
              <PlanningHorizonChart months={horizonMonths} className="min-h-[18rem]" />
              <PlanningHorizonTable months={horizonMonths} className="min-h-[18rem]" />
            </div>
          </section>
        )}
      </div>
    )
  })
}
