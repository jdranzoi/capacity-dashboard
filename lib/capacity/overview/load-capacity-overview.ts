import { loadWeeklyOverview, type WeeklyHeadline } from '@/lib/overview/load-weekly-overview'
import { createServiceClientCached } from '@/lib/supabase/server'
import { loadRoleAnalytics, type RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'

export type CapacityOverviewPayload = {
  weeks: WeeklyHeadline[]
  roleSummary: RoleAnalyticsRow[]
}

export async function loadCapacityOverview(params: {
  monthStartStr: string
  snapshot: { id: string; createdAt: string }
  personIdFilter: Set<string> | null
  referenceDate?: Date
  now?: Date
}): Promise<{ data: CapacityOverviewPayload | null; error: string | null }> {
  const { monthStartStr, snapshot, personIdFilter, referenceDate, now } = params

  const [overview, roleResult] = await Promise.all([
    loadWeeklyOverview(referenceDate, now, snapshot, personIdFilter),
    loadRoleAnalytics(createServiceClientCached(), {
      monthStartStr,
      snapshot,
      personIdFilter,
      now,
    }),
  ])

  if (overview.error) {
    return { data: null, error: overview.error }
  }
  if (roleResult.error) {
    return { data: null, error: roleResult.error }
  }

  const roleSummary = [...roleResult.data].sort(
    (a, b) => b.netCapacityHours - a.netCapacityHours
  )

  return {
    data: { weeks: overview.weeks, roleSummary },
    error: null,
  }
}
