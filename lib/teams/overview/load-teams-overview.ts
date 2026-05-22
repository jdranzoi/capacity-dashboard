import type { SupabaseClient } from '@supabase/supabase-js'
import { differenceInMonths, endOfMonth, parse, parseISO } from 'date-fns'

import { getMonthFactBundle } from '@/lib/data/load-month-fact-bundle'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { createServiceClientCached } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { fetchMonthRolesForPeople } from '@/lib/workforce/month-role'

const DIM_BATCH = 200

export type TeamsDistributionRow = {
  id: string | null
  key: string
  label: string
  headcount: number
  sharePct: number | null
}

export type TeamsOverviewPayload = {
  monthLabel: string
  snapshotId: string
  syncCreatedAt: string | null
  headcount: number
  activeRoleCount: number
  locationCount: number
  avgTenureMonths: number | null
  byRole: TeamsDistributionRow[]
  byZone: TeamsDistributionRow[]
}

function sharePct(headcount: number, total: number): number | null {
  if (total <= 0 || headcount <= 0) return null
  return roundDisplayStat((headcount / total) * 100)
}

function groupKey(id: string | null): string {
  return id == null ? '__none__' : id
}

function buildDistributionRows(
  counts: Map<string, { id: string | null; key: string; label: string; headcount: number }>,
  totalHeadcount: number
): TeamsDistributionRow[] {
  return Array.from(counts.values())
    .filter((row) => row.headcount > 0)
    .sort((a, b) => b.headcount - a.headcount || a.label.localeCompare(b.label, 'en'))
    .map((row) => ({
      id: row.id,
      key: row.key,
      label: row.label,
      headcount: row.headcount,
      sharePct: sharePct(row.headcount, totalHeadcount),
    }))
}

export async function loadTeamsOverview(params: {
  monthStartStr: string
  monthEndStr: string
  monthLabel: string
  snapshot: { id: string; createdAt: string }
}): Promise<{ data: TeamsOverviewPayload | null; error: string | null }> {
  const { monthStartStr, monthEndStr, monthLabel, snapshot } = params
  const snapshotId = snapshot.id

  try {
    const bundleResult = await getMonthFactBundle(snapshotId, monthStartStr, monthEndStr)
    if (bundleResult.error || !bundleResult.data) {
      return {
        data: null,
        error: bundleResult.error
          ? `month facts: ${bundleResult.error}`
          : 'month facts: unexpected empty result',
      }
    }

    const rosterPersonIds = Array.from(
      new Set(bundleResult.data.capacity.map((row) => row.person_id))
    )
    if (rosterPersonIds.length === 0) {
      return {
        data: {
          monthLabel,
          snapshotId,
          syncCreatedAt: snapshot.createdAt,
          headcount: 0,
          activeRoleCount: 0,
          locationCount: 0,
          avgTenureMonths: null,
          byRole: [],
          byZone: [],
        },
        error: null,
      }
    }

    const supabase = createServiceClientCached()
    const [roleMapResult, peopleResult, rolesResult, zonesResult] = await Promise.all([
      fetchMonthRolesForPeople(supabase, {
        snapshotId,
        monthStartStr,
        monthEndStr,
        personIds: rosterPersonIds,
      }),
      loadPeopleMeta(supabase, rosterPersonIds),
      supabase.from('dim_role').select('id, key, label'),
      supabase.from('dim_zone').select('id, key, label'),
    ])

    if (roleMapResult.error) {
      return { data: null, error: roleMapResult.error }
    }
    if (peopleResult.error) {
      return { data: null, error: peopleResult.error }
    }
    if (rolesResult.error) {
      return { data: null, error: rolesResult.error.message }
    }
    if (zonesResult.error) {
      return { data: null, error: zonesResult.error.message }
    }

    const roleMeta = new Map<string, { key: string; label: string }>()
    for (const row of rolesResult.data ?? []) {
      roleMeta.set(row.id, { key: row.key, label: row.label })
    }

    const zoneMeta = new Map<string, { key: string; label: string }>()
    for (const row of zonesResult.data ?? []) {
      zoneMeta.set(row.id, { key: row.key, label: row.label })
    }

    const byRole = new Map<
      string,
      { id: string | null; key: string; label: string; headcount: number }
    >()
    const byZone = new Map<
      string,
      { id: string | null; key: string; label: string; headcount: number }
    >()
    const tenureSamples: number[] = []
    const referenceDate = endOfMonth(parse(monthStartStr, 'yyyy-MM-dd', new Date()))

    for (const personId of rosterPersonIds) {
      const roleId = roleMapResult.roleByPerson.get(personId) ?? null
      const roleKey = groupKey(roleId)
      const roleInfo = roleId ? roleMeta.get(roleId) : null
      const roleRow = byRole.get(roleKey) ?? {
        id: roleId,
        key: roleInfo?.key ?? 'unassigned',
        label: roleInfo?.label ?? 'Unassigned',
        headcount: 0,
      }
      roleRow.headcount += 1
      byRole.set(roleKey, roleRow)

      const person = peopleResult.peopleById.get(personId)
      const zoneId = person?.zoneId ?? null
      const zoneKey = groupKey(zoneId)
      const zoneInfo = zoneId ? zoneMeta.get(zoneId) : null
      const zoneRow = byZone.get(zoneKey) ?? {
        id: zoneId,
        key: zoneInfo?.key ?? 'unassigned',
        label: zoneInfo?.label ?? 'Unassigned',
        headcount: 0,
      }
      zoneRow.headcount += 1
      byZone.set(zoneKey, zoneRow)

      if (person?.hireDate) {
        const months = differenceInMonths(referenceDate, parseISO(person.hireDate))
        if (months >= 0) {
          tenureSamples.push(months)
        }
      }
    }

    const headcount = rosterPersonIds.length
    const activeRoleCount = Array.from(byRole.values()).filter(
      (row) => row.id != null && row.headcount > 0
    ).length
    const locationCount = Array.from(byZone.values()).filter(
      (row) => row.id != null && row.headcount > 0
    ).length
    const avgTenureMonths =
      tenureSamples.length > 0
        ? roundDisplayStat(
            tenureSamples.reduce((sum, value) => sum + value, 0) / tenureSamples.length
          )
        : null

    return {
      data: {
        monthLabel,
        snapshotId,
        syncCreatedAt: snapshot.createdAt,
        headcount,
        activeRoleCount,
        locationCount,
        avgTenureMonths,
        byRole: buildDistributionRows(byRole, headcount),
        byZone: buildDistributionRows(byZone, headcount),
      },
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load teams overview.'
    return { data: null, error: message }
  }
}

async function loadPeopleMeta(
  supabase: SupabaseClient<Database>,
  personIds: readonly string[]
): Promise<{
  peopleById: Map<string, { zoneId: string | null; hireDate: string | null }>
  error: string | null
}> {
  const peopleById = new Map<string, { zoneId: string | null; hireDate: string | null }>()

  for (let i = 0; i < personIds.length; i += DIM_BATCH) {
    const slice = personIds.slice(i, i + DIM_BATCH)
    const { data, error } = await supabase
      .from('dim_person')
      .select('id, zone_id, hire_date')
      .in('id', slice)

    if (error) {
      return { peopleById, error: error.message }
    }

    for (const row of data ?? []) {
      peopleById.set(row.id, {
        zoneId: row.zone_id,
        hireDate: row.hire_date,
      })
    }
  }

    return { peopleById, error: null }
}
