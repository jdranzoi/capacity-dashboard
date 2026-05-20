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
  billableVersusLoggedEfficiencyPct,
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

export type TeamStaffingProjectRef = {
  projectId: string
  /** Stable slug from `dim_project.project_key` (compact grid display). */
  projectKey: string
}

export type TeamStaffingRow = {
  personId: string
  /** From `dim_person.name`. */
  personName: string
  roleLabel: string
  netCapacityHours: number
  plannedHours: number
  loggedHoursMtd: number
  /** Logged (MTD) vs elapsed net weekdays × 8h; zone holidays and weekday PTO through worklog as-of. */
  utilizationPct: number | null
  billableEfficiencyPct: number | null
  ptoHoursMonth: number
  /** Projects with non-PTO logged time in the MTD window (same bound as Logged). */
  projects: TeamStaffingProjectRef[]
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
 * Person-level staffing rows for `/team` (SLOT-E). Same snapshot month, worklog MTD cap,
 * and optional person filter as `loadTeamRoleAnalytics` / `loadWeeklyOverview`.
 * Row utilization is **pace**: `personLoggedUtilizationPct` with zone holidays and weekday PTO through as-of.
 * Role label from stamped `role_id` on bench → plans → worklogs (D-022).
 */
export async function loadTeamStaffingRows(
  supabase: SupabaseClient<Database>,
  params: {
    monthStartStr: string
    snapshot: { id: string; createdAt: string }
    personIdFilter: Set<string> | null
    now?: Date
  }
): Promise<{ data: TeamStaffingRow[]; error: string | null }> {
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
      pagedQuery<{
        person_id: string
        project_id: string
        logged_seconds: number
        billable_seconds: number
      }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('person_id, project_id, logged_seconds, billable_seconds')
          .eq('is_pto', false)
          .gte('log_date', monthStartStr)
          .lte('log_date', logThroughStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
      ),
      pagedQuery<{ person_id: string; log_date: string; logged_seconds: number }>(async (from) =>
        supabase
          .from('fact_worklogs')
          .select('person_id, log_date, logged_seconds')
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
    const billableByPerson = new Map<string, number>()
    const projectHoursByPerson = new Map<string, Map<string, number>>()

    for (const r of wlRes.rows) {
      if (!keepPerson(personIdFilter, r.person_id)) continue
      const pid = r.person_id
      const logH = Number(r.logged_seconds) / 3600
      const billH = Number(r.billable_seconds) / 3600
      loggedByPerson.set(pid, (loggedByPerson.get(pid) ?? 0) + logH)
      billableByPerson.set(pid, (billableByPerson.get(pid) ?? 0) + billH)

      let pmap = projectHoursByPerson.get(pid)
      if (!pmap) {
        pmap = new Map()
        projectHoursByPerson.set(pid, pmap)
      }
      pmap.set(r.project_id, (pmap.get(r.project_id) ?? 0) + logH)
    }

    const ptoByPerson = new Map<string, number>()
    for (const r of ptoRes.rows) {
      if (!keepPerson(personIdFilter, r.person_id)) continue
      const pid = r.person_id
      const h = Number(r.logged_seconds) / 3600
      ptoByPerson.set(pid, (ptoByPerson.get(pid) ?? 0) + h)
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

    const allProjectIds = new Set<string>()
    for (const pmap of projectHoursByPerson.values()) {
      for (const [projId, hours] of pmap) {
        if (hours > 0) allProjectIds.add(projId)
      }
    }

    const projectKeyById = new Map<string, string>()
    const projList = Array.from(allProjectIds)
    const PROJ_BATCH = 120
    for (let i = 0; i < projList.length; i += PROJ_BATCH) {
      const slice = projList.slice(i, i + PROJ_BATCH)
      const { data: projRows, error: projErr } = await supabase
        .from('dim_project')
        .select('id, project_key')
        .in('id', slice)
      if (projErr) return { data: [], error: projErr.message }
      for (const row of projRows ?? []) {
        projectKeyById.set(row.id, row.project_key)
      }
    }

    const roleMeta = new Map<string, { label: string }>()
    const { data: allRoles, error: roleErr } = await supabase
      .from('dim_role')
      .select('id, label')
    if (roleErr) return { data: [], error: roleErr.message }
    for (const row of allRoles ?? []) {
      roleMeta.set(row.id, { label: row.label })
    }

    const { roleByPerson, error: roleMapErr } = await fetchMonthRolesForPeople(supabase, {
      snapshotId,
      monthStartStr,
      monthEndStr,
      personIds: capacityPersonIds,
    })
    if (roleMapErr) return { data: [], error: roleMapErr }

    const personMeta = new Map<string, { name: string; zoneId: string | null }>()
    for (let i = 0; i < capacityPersonIds.length; i += DIM_BATCH) {
      const slice = capacityPersonIds.slice(i, i + DIM_BATCH)
      const { data: people, error: pErr } = await supabase
        .from('dim_person')
        .select('id, name, zone_id')
        .in('id', slice)
      if (pErr) return { data: [], error: pErr.message }
      for (const row of people ?? []) {
        personMeta.set(row.id, { name: row.name, zoneId: row.zone_id })
      }
    }

    const rowsOut: TeamStaffingRow[] = []

    for (const pid of capacityPersonIds) {
      const meta = personMeta.get(pid)
      const personName =
        meta?.name != null && meta.name.trim() !== '' ? meta.name.trim() : '—'
      const monthRoleId = roleByPerson.get(pid) ?? null
      const roleLabel = monthRoleId ? (roleMeta.get(monthRoleId)?.label ?? '—') : 'Unassigned'

      const netRaw = capByPerson.get(pid) ?? 0
      const plannedRaw = plannedByPerson.get(pid) ?? 0
      const loggedRaw = loggedByPerson.get(pid) ?? 0
      const billRaw = billableByPerson.get(pid) ?? 0
      const ptoRaw = ptoByPerson.get(pid) ?? 0

      const netRounded = roundDisplayStat(netRaw)
      const plannedRounded = roundDisplayStat(plannedRaw)
      const loggedRounded = roundDisplayStat(loggedRaw)
      const billRounded = roundDisplayStat(billRaw)
      const ptoRounded = roundDisplayStat(ptoRaw)

      const zoneId = meta?.zoneId ?? null
      const elapsedNet = teamPersonElapsedNetWeekdays({
        personId: pid,
        zoneId,
        eligibleWeekdays,
        holidaysByZone,
        ptoWeekdayByPerson,
      })
      const pacePctRaw = personLoggedUtilizationPct(
        loggedRaw,
        elapsedNet,
        STANDARD_WORKDAY_HOURS
      )
      const pacePct = pacePctRaw != null ? roundDisplayStat(pacePctRaw) : null

      const pmap = projectHoursByPerson.get(pid)
      const projects: TeamStaffingProjectRef[] = []
      if (pmap) {
        for (const [projectId, hours] of pmap) {
          if (hours <= 0) continue
          projects.push({
            projectId,
            projectKey: projectKeyById.get(projectId) ?? projectId,
          })
        }
        projects.sort((a, b) =>
          a.projectKey.localeCompare(b.projectKey, 'en', { sensitivity: 'base' })
        )
      }

      rowsOut.push({
        personId: pid,
        personName,
        roleLabel,
        netCapacityHours: netRounded,
        plannedHours: plannedRounded,
        loggedHoursMtd: loggedRounded,
        utilizationPct: pacePct,
        billableEfficiencyPct: billableVersusLoggedEfficiencyPct(billRounded, loggedRounded),
        ptoHoursMonth: ptoRounded,
        projects,
      })
    }

    return { data: rowsOut, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load staffing rows.'
    return { data: [], error: message }
  }
}
