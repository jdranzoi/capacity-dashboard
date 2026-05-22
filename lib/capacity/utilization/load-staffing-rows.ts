import type { SupabaseClient } from '@supabase/supabase-js'
import { endOfMonth, format, parse } from 'date-fns'

import {
  billableVersusLoggedEfficiencyPct,
  personLoggedUtilizationPct,
  STANDARD_WORKDAY_HOURS,
} from '@/lib/domain/workload-metrics'
import {
  filterHolidaysThrough,
  filterRowsByPerson,
  filterWorklogsThrough,
  getMonthFactBundle,
} from '@/lib/data/load-month-fact-bundle'
import { overviewLogThroughDate } from '@/lib/overview/worklog-through-date'
import {
  teamEligibleWeekdayDates,
  teamHolidaysByZoneForEligible,
  teamPersonElapsedNetWeekdays,
  teamPtoWeekdayDatesThrough,
} from '@/lib/capacity/shared/elapsed-pace-context'
import { roundDisplayStat } from '@/lib/format/display-stats'
import type { Database } from '@/lib/supabase/database.types'
import { fetchMonthRolesForPeople } from '@/lib/workforce/month-role'

const DIM_BATCH = 200

export type UtilizationStaffingProjectRef = {
  projectId: string
  /** Stable slug from `dim_project.project_key` (compact grid display). */
  projectKey: string
}

export type UtilizationStaffingRow = {
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
  projects: UtilizationStaffingProjectRef[]
}

/**
 * Person-level staffing rows for capacity utilization (SLOT-E). Same snapshot month, worklog MTD cap,
 * and optional person filter as `loadRoleAnalytics` / `loadWeeklyOverview`.
 * Row utilization is **pace**: `personLoggedUtilizationPct` with zone holidays and weekday PTO through as-of.
 * Role label from stamped `role_id` on bench → plans → worklogs (D-022).
 */
export async function loadUtilizationStaffingRows(
  supabase: SupabaseClient<Database>,
  params: {
    monthStartStr: string
    snapshot: { id: string; createdAt: string }
    personIdFilter: Set<string> | null
    now?: Date
  }
): Promise<{ data: UtilizationStaffingRow[]; error: string | null }> {
  const { monthStartStr, snapshot, personIdFilter } = params
  const now = params.now ?? new Date()

  if (personIdFilter && personIdFilter.size === 0) {
    return { data: [], error: null }
  }

  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEnd = endOfMonth(referenceDate)
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd')
  const logThroughStr = overviewLogThroughDate(monthEnd, snapshot.createdAt, now)
  const snapshotId = snapshot.id

  try {
    const bundleResult = await getMonthFactBundle(snapshotId, monthStartStr, monthEndStr)
    if (bundleResult.error || !bundleResult.data) {
      return {
        data: [],
        error: bundleResult.error
          ? `month facts: ${bundleResult.error}`
          : 'month facts: unexpected empty result',
      }
    }

    const bundle = bundleResult.data
    const capRows = filterRowsByPerson(bundle.capacity, personIdFilter)
    const planRows = filterRowsByPerson(bundle.plans, personIdFilter)
    const wlRows = filterWorklogsThrough(
      filterRowsByPerson(bundle.worklogs, personIdFilter),
      logThroughStr
    )
    const ptoRows = filterRowsByPerson(bundle.ptoWorklogs, personIdFilter)
    const holidayRows = filterHolidaysThrough(bundle.holidays, logThroughStr)

    const capByPerson = new Map<string, number>()
    for (const r of capRows) {
      const h = Number(r.net_capacity_hours)
      capByPerson.set(r.person_id, (capByPerson.get(r.person_id) ?? 0) + h)
    }

    const plannedByPerson = new Map<string, number>()
    for (const r of planRows) {
      plannedByPerson.set(
        r.person_id,
        (plannedByPerson.get(r.person_id) ?? 0) + Number(r.planned_hours ?? 0)
      )
    }

    const loggedByPerson = new Map<string, number>()
    const billableByPerson = new Map<string, number>()
    const projectHoursByPerson = new Map<string, Map<string, number>>()

    for (const r of wlRows) {
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
    for (const r of ptoRows) {
      const pid = r.person_id
      const h = Number(r.logged_seconds) / 3600
      ptoByPerson.set(pid, (ptoByPerson.get(pid) ?? 0) + h)
    }

    const eligibleWeekdays = teamEligibleWeekdayDates(referenceDate, logThroughStr)
    const holidaysByZone = teamHolidaysByZoneForEligible(holidayRows, eligibleWeekdays)
    const ptoWeekdayByPerson = teamPtoWeekdayDatesThrough(
      ptoRows,
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

    const rowsOut: UtilizationStaffingRow[] = []

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
      const projects: UtilizationStaffingProjectRef[] = []
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
