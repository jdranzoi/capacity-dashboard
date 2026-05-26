import { connection } from 'next/server'

import { CapacityDataError } from '@/components/capacity/_shared/capacity-data-error'
import { CapacityPlanningAvailablePeopleCard } from '@/components/capacity/planning/capacity-planning-available-people-card'
import { loadPlanningAvailablePeople } from '@/lib/capacity/planning/load-planning-available-people'
import { loadPlanningMonthOptions } from '@/lib/capacity/planning/load-planning-month-options'
import { resolvePlanningPeriod } from '@/lib/capacity/planning/planning-route-period'

export async function CapacityPlanningAvailablePeopleBlock({
  fromParam,
  toParam,
  peopleMonthParam,
  minAvailParam,
  peopleRoleParam,
}: {
  fromParam?: string
  toParam?: string
  peopleMonthParam?: string
  minAvailParam?: string
  peopleRoleParam?: string
}) {
  await connection()

  const [{ options, error: monthOptErr }, result] = await Promise.all([
    loadPlanningMonthOptions(),
    loadPlanningAvailablePeople({
      fromParam,
      toParam,
      peopleMonthParam,
      minAvailabilityParam: minAvailParam,
      roleFilterParam: peopleRoleParam,
    }),
  ])

  if (monthOptErr) return <CapacityDataError message={monthOptErr} />
  if (result.error) return <CapacityDataError message={result.error} />

  const period = resolvePlanningPeriod(options, fromParam, toParam)
  if (!period) return null

  const selectedMonthKey =
    result.selectedMonthKey ?? (period.monthKeys[1] ?? period.monthKeys[0])!

  return (
    <CapacityPlanningAvailablePeopleCard
      people={result.people}
      period={period}
      selectedMonthKey={selectedMonthKey}
      selectedRole={result.selectedRole}
      minAvailability={result.minAvailability}
      roleOptions={result.roleOptions}
    />
  )
}
