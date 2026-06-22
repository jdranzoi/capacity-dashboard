import { connection } from 'next/server'

import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { CapacityPlanningHeader } from '@/components/capacity/planning/capacity-planning-header'
import { CapacityPlanningMonthKpiStrip } from '@/components/capacity/planning/capacity-planning-month-kpi-strip'
import { CapacityPlanningPeriodPicker } from '@/components/capacity/planning/capacity-planning-period-picker'
import { loadPlanningWorkspaceCached } from '@/lib/capacity/planning/load-planning-workspace'
import { loadPlanningMonthOptions } from '@/lib/capacity/planning/load-planning-month-options'

export async function CapacityPlanningChromeBlock({
  fromParam,
  toParam,
}: {
  fromParam?: string
  toParam?: string
}) {
  await connection()

  const [{ options, error: monthOptErr }, workspaceResult] = await Promise.all([
    loadPlanningMonthOptions(),
    loadPlanningWorkspaceCached(fromParam, toParam),
  ])

  if (monthOptErr) return <SectionDataError message={monthOptErr} />
  if (options.length === 0) return <SectionEmptyState />
  if (workspaceResult.error) return <SectionDataError message={workspaceResult.error} />
  if (!workspaceResult.data) return <SectionEmptyState />

  const data = workspaceResult.data

  return (
    <>
      <CapacityPlanningHeader
        title="Capacity Planning"
        subtitle="Forward staffing and allocation planning across people and projects."
        periodPicker={
          <CapacityPlanningPeriodPicker
            options={options}
            fromMonthKey={data.period.fromMonthKey}
            toMonthKey={data.period.toMonthKey}
          />
        }
      />
      <CapacityPlanningMonthKpiStrip monthKpis={data.monthKpis} />
    </>
  )
}
