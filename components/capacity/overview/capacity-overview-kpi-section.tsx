import { CapacityOpsKpiColumns } from '@/components/capacity/_shared/capacity-ops-kpi-columns'
import type { CapacityOverviewPayload } from '@/lib/capacity/overview/load-capacity-overview'

export function CapacityOverviewKpiSection({ data }: { data: CapacityOverviewPayload }) {
  const r = data.orgMonthRollupHours

  return (
    <CapacityOpsKpiColumns
      showColumnTitles={false}
      values={{
        netCapacityHours: r.netCapacityHours,
        elapsedCapacityHours: r.elapsedCapacityHours,
        plannedHours: r.plannedHours,
        ptoHoursMonth: r.ptoHoursMonth,
        loggedHoursMtd: r.loggedHoursMtd,
        nonCommercialLoggedHoursMtd: data.nonCommercialLoggedHoursMtd,
        commercialLoggedHoursMtd: data.commercialLoggedHoursMtd,
        capacityFillPct: data.capacityFillPct,
        utilizationPct: data.utilizationPct,
        commercialUtilizationPct: data.commercialUtilizationPct,
        asOfDate: data.asOfDate,
        projectScoped: false,
      }}
    />
  )
}
