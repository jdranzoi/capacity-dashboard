import { CapacityOpsKpiColumns } from '@/components/capacity/_shared/capacity-ops-kpi-columns'
import type { UtilizationMonthKpisPayload } from '@/lib/capacity/utilization/load-month-kpis'

export function UtilizationKpiSection({ kpis }: { kpis: UtilizationMonthKpisPayload }) {
  const { rollupHours: r, projectScopedHours: scoped } = kpis
  const plannedHours = scoped?.plannedHours ?? r.plannedHours
  const loggedHours = scoped?.loggedHoursMtd ?? r.loggedHoursMtd

  return (
    <CapacityOpsKpiColumns
      values={{
        netCapacityHours: r.netCapacityHours,
        elapsedCapacityHours: r.elapsedCapacityHours,
        plannedHours,
        ptoHoursMonth: r.ptoHoursMonth,
        loggedHoursMtd: loggedHours,
        nonCommercialLoggedHoursMtd: kpis.nonCommercialLoggedHoursMtd,
        commercialLoggedHoursMtd: kpis.commercialLoggedHoursMtd,
        capacityFillPct: kpis.capacityFillPct,
        utilizationPct: kpis.utilizationPct,
        commercialUtilizationPct: kpis.commercialUtilizationPct,
        asOfDate: kpis.asOfDate,
        projectScoped: scoped != null,
      }}
    />
  )
}
