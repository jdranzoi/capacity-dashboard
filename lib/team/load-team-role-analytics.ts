import type { SupabaseClient } from '@supabase/supabase-js'
import {
  endOfMonth,
  format,
  min as minDate,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns'

import {
  meanPersonLoggedUtilizationPct,
  overviewWeeklyLoggedUtilizationPct,
  personLoggedUtilizationPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'
import {
  teamEligibleWeekdayDates,
  teamHolidaysByZoneForEligible,
  teamPersonElapsedNetWeekdays,
  teamPtoWeekdayDatesThrough,
} from '@/lib/team/team-elapsed-pace-context'
import { roundDisplayStat } from '@/lib/format/display-stats'
import type { Database } from '@/lib/supabase/database.types'
import { fetchMonthRolesForPeople } from '@/lib/team/team-month-role'

const PAGE = 1000
const DIM_BATCH = 200

export type TeamRoleAnalyticsRow = {
  roleId: string | null
  roleKey: string
  roleLabel: string
  headcount: number
  netCapacityHours: number
  plannedHours: number
  loggedHoursMtd: number
  /** Mean of per-person pace: logged MTD ÷ (elapsed net weekdays × 8h); same eligibility as overview donut. */
  utilizationPct: number | null
  /** Rolled-up hours ratio: sum logged MTD / sum monthly net capacity. */
  utilizationCapacityFillPct: number | null
}

type PagedResult<T> = { rows: T[]; error: string | null }

async function pagedQuery<T>(
  run: (from: number) => Promise<{ data: unknown; error: { message: string } | null }>
): Promise<PagedResult<T>> {
  const rows: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await run(from)
    if (error) return { rows: [], error: error.message }
    const batch = (data as T[] | null) ?? []
    rows.push(...batch)
    if (batch.length < PAGE) break
    from += PAGE
  }
  return { rows, error: null }
}

function keepPerson(personIdFilter: Set<string> | null, pid: string): boolean {
  return personIdFilter == null || personIdFilter.has(pid)
}

/**
 * Role-level aggregates for `/team` analytics (D1–D3). Roster from `fact_capacity`;
 * grouping by month role from stamped `role_id` on bench → plans → worklogs.
 */
export async function loadTeamRoleAnalytics(
  supabase: SupabaseClient<Database>,
  params: {
    monthStartStr: string
    snapshot: { id: string; createdAt: string }
    personIdFilter: Set<string> | null
    now?: Date
  }
): Promise<{ data: TeamRoleAnalyticsRow[]; error: string | null }> {
  const { monthStartStr, snapshot, personIdFilter } = params
  const now = params.now ?? new Date()

  if (personIdFilter && personIdFilter.size === 0) {
    return { data: [], error: null }
  }

  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEnd = endOfMonth(referenceDate)
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd')
  const logThroughStr = format(
    minDate([monthEnd, startOfDay(parseISO(snapshot.createdAt)), startOfDay(now)]),
    'yyyy-MM-dd'
  )
  const snapshotId = snapshot.id

  try {
    const [capRes, planRes, wlRes, ptoRes, holidayRes] = await Promise.all([
      pagedQuery<{ person_id: string; net_capacity_hours: number }>(async (from) =>
        supabase
          .from('fact_capacity')
          .select('person_id, net_capacity_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ person_id: string; planned_hours: number | null }>(async (from) =>
        supabase
          .from('fact_plans')
          .select('person_id, planned_hours')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .eq('is_pto', false)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ person_id: string; logged_seconds: number }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('person_id, logged_seconds')
          .eq('is_pto', false)
          .gte('log_date', monthStartStr)
          .lte('log_date', logThroughStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ person_id: string; log_date: string }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('person_id, log_date')
          .eq('is_pto', true)
          .gte('log_date', monthStartStr)
          .lte('log_date', monthEndStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ zone_id: string; date: string }>(async (from) =>
        supabase
          .from('dim_holiday')
          .select('zone_id, date')
          .gte('date', monthStartStr)
          .lte('date', logThroughStr)
          .order('date')
          .range(from, from + PAGE - 1)
      ),
    ])

    if (capRes.error) return { data: [], error: `fact_capacity: ${capRes.error}` }
    if (planRes.error) return { data: [], error: `fact_plans: ${planRes.error}` }
    if (wlRes.error) return { data: [], error: `fact_worklogs: ${wlRes.error}` }
    if (ptoRes.error) return { data: [], error: `fact_worklogs (PTO): ${ptoRes.error}` }
    if (holidayRes.error) return { data: [], error: `dim_holiday: ${holidayRes.error}` }

    const capByPerson = new Map<string, number>()
    for (const r of capRes.rows) {
      if (!keepPerson(personIdFilter, r.person_id)) continue
      const h = Number(r.net_capacity_hours)
      capByPerson.set(r.person_id, (capByPerson.get(r.person_id) ?? 0) + h)
    }

    const plannedByPerson = new Map<string, number>()
    for (const r of planRes.rows) {
      if (!keepPerson(personIdFilter, r.person_id)) continue
      plannedByPerson.set(
        r.person_id,
        (plannedByPerson.get(r.person_id) ?? 0) + Number(r.planned_hours ?? 0)
      )
    }

    const loggedByPerson = new Map<string, number>()
    for (const r of wlRes.rows) {
      if (!keepPerson(personIdFilter, r.person_id)) continue
      loggedByPerson.set(
        r.person_id,
        (loggedByPerson.get(r.person_id) ?? 0) + Number(r.logged_seconds) / 3600
      )
    }

    const eligibleWeekdays = teamEligibleWeekdayDates(referenceDate, logThroughStr)
    const holidaysByZone = teamHolidaysByZoneForEligible(holidayRes.rows, eligibleWeekdays)
    const ptoWeekdayByPerson = teamPtoWeekdayDatesThrough(
      ptoRes.rows.filter((r) => keepPerson(personIdFilter, r.person_id)),
      logThroughStr,
      referenceDate
    )

    const capacityPersonIds = Array.from(capByPerson.keys())
    if (capacityPersonIds.length === 0) {
      return { data: [], error: null }
    }

    const { roleByPerson, error: roleMapErr } = await fetchMonthRolesForPeople(supabase, {
      snapshotId,
      monthStartStr,
      monthEndStr,
      personIds: capacityPersonIds,
    })
    if (roleMapErr) return { data: [], error: roleMapErr }

    const personZoneId = new Map<string, string | null>()
    for (let i = 0; i < capacityPersonIds.length; i += DIM_BATCH) {
      const slice = capacityPersonIds.slice(i, i + DIM_BATCH)
      const { data: people, error: pErr } = await supabase
        .from('dim_person')
        .select('id, zone_id')
        .in('id', slice)
      if (pErr) return { data: [], error: pErr.message }
      for (const row of people ?? []) {
        personZoneId.set(row.id, row.zone_id)
      }
    }

    const roleMeta = new Map<string, { key: string; label: string }>()
    const { data: allRoles, error: roleErr } = await supabase
      .from('dim_role')
      .select('id, key, label')
    if (roleErr) return { data: [], error: roleErr.message }
    for (const row of allRoles ?? []) {
      roleMeta.set(row.id, { key: row.key, label: row.label })
    }

    type Agg = {
      headcount: number
      netCapacityHours: number
      plannedHours: number
      loggedHoursMtd: number
    }

    const groupKey = (roleId: string | null) => (roleId == null ? '__none__' : roleId)
    const byRole = new Map<string, Agg>()
    const paceSamplesByRole = new Map<string, number[]>()

    const bump = (roleId: string | null, pid: string) => {
      const k = groupKey(roleId)
      let a = byRole.get(k)
      if (!a) {
        a = { headcount: 0, netCapacityHours: 0, plannedHours: 0, loggedHoursMtd: 0 }
        byRole.set(k, a)
      }
      a.headcount += 1
      a.netCapacityHours += capByPerson.get(pid) ?? 0
      a.plannedHours += plannedByPerson.get(pid) ?? 0
      a.loggedHoursMtd += loggedByPerson.get(pid) ?? 0
    }

    for (const pid of capacityPersonIds) {
      const rid = roleByPerson.get(pid) ?? null
      bump(rid, pid)
      const elapsed = teamPersonElapsedNetWeekdays({
        personId: pid,
        zoneId: personZoneId.get(pid) ?? null,
        eligibleWeekdays,
        holidaysByZone,
        ptoWeekdayByPerson,
      })
      const logged = loggedByPerson.get(pid) ?? 0
      const pace = personLoggedUtilizationPct(logged, elapsed, STANDARD_WORKDAY_HOURS)
      if (pace !== null) {
        const k = groupKey(rid)
        let samples = paceSamplesByRole.get(k)
        if (!samples) {
          samples = []
          paceSamplesByRole.set(k, samples)
        }
        samples.push(pace)
      }
    }

    const tmp: { sort: string; row: TeamRoleAnalyticsRow }[] = []
    for (const [k, agg] of byRole) {
      const roleId = k === '__none__' ? null : k
      const meta = roleId ? roleMeta.get(roleId) : null
      const roleKey = meta?.key ?? 'unassigned'
      const roleLabel = meta?.label ?? 'Unassigned'
      const sort = meta ? meta.label.toLowerCase() : 'zzz_unassigned'
      const netRounded = roundDisplayStat(agg.netCapacityHours)
      const loggedRounded = roundDisplayStat(agg.loggedHoursMtd)
      const paceSamples = paceSamplesByRole.get(k) ?? []
      const utilizationPacePct =
        paceSamples.length > 0
          ? roundDisplayStat(meanPersonLoggedUtilizationPct(paceSamples)!)
          : null
      const utilizationCapacityFillPct = overviewWeeklyLoggedUtilizationPct(
        loggedRounded,
        netRounded
      )
      tmp.push({
        sort,
        row: {
          roleId,
          roleKey,
          roleLabel,
          headcount: agg.headcount,
          netCapacityHours: netRounded,
          plannedHours: roundDisplayStat(agg.plannedHours),
          loggedHoursMtd: loggedRounded,
          utilizationPct: utilizationPacePct,
          utilizationCapacityFillPct,
        },
      })
    }

    tmp.sort((a, b) => a.sort.localeCompare(b.sort))
    const rowsOut = tmp.map((t) => t.row)

    return { data: rowsOut, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load role analytics.'
    return { data: [], error: message }
  }
}
