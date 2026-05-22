import { cacheLife, cacheTag } from 'next/cache'
import { endOfMonth, format, parse } from 'date-fns'

import { pagedQuery } from '@/lib/data/paged-query'
import { filterRowsByPerson, getMonthFactBundle } from '@/lib/data/load-month-fact-bundle'
import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { plannedPct } from '@/lib/domain/workload-metrics'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { fetchMonthRolesForPeople } from '@/lib/workforce/month-role'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

export type PlanningRoleRow = {
  roleKey: string
  roleLabel: string
  headcount: number
  plannedHours: number
  netCapacityHours: number
  plannedPct: number | null
}

export type PlanningProjectRow = {
  projectId: string
  projectKey: string
  projectName: string
  projectType: string
  isCommercial: boolean
  plannedHours: number
  distinctPersonCount: number
}

export type CapacityPlanningPayload = {
  monthLabel: string
  snapshotId: string
  netCapacityHours: number
  totalPlannedHours: number
  plannedUtilizationPct: number | null
  projectsWithPlansCount: number
  planVsCapacityGapHours: number
  byRole: PlanningRoleRow[]
  byProject: PlanningProjectRow[]
}

type ProjectPlanRow = {
  person_id: string
  project_id: string | null
  planned_hours: number
  role_id: string | null
}

type ProjectMeta = {
  id: string
  project_key: string
  project_name: string | null
  project_type: string
  is_commercial: boolean
}

async function loadProjectGrainPlans(
  snapshotId: string,
  monthStartStr: string,
  personIdFilter: Set<string> | null
): Promise<{ rows: ProjectPlanRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()

  const result = await pagedQuery<ProjectPlanRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, project_id, planned_hours, role_id')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .order('person_id')
      .range(from, from + PAGE - 1)
  )

  if (result.error) return { rows: [], error: result.error }

  const rows = personIdFilter
    ? result.rows.filter((r) => personIdFilter.has(r.person_id))
    : result.rows

  return { rows, error: null }
}

export async function loadCapacityPlanning(params: {
  monthStartStr: string
  monthLabel: string
  snapshot: { id: string; createdAt: string }
  personIdFilter: Set<string> | null
}): Promise<{ data: CapacityPlanningPayload | null; error: string | null }> {
  const { monthStartStr, monthLabel, snapshot, personIdFilter } = params
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
  const supabase = createServiceClientCached()

  const [bundleResult, planRowsResult] = await Promise.all([
    getMonthFactBundle(snapshot.id, monthStartStr, monthEndStr),
    loadProjectGrainPlans(snapshot.id, monthStartStr, personIdFilter),
  ])

  if (bundleResult.error || !bundleResult.data) {
    return { data: null, error: bundleResult.error ?? 'Could not load month facts.' }
  }
  if (planRowsResult.error) {
    return { data: null, error: planRowsResult.error }
  }

  const capRows = filterRowsByPerson(bundleResult.data.capacity, personIdFilter)
  const planRows = planRowsResult.rows

  const netCapacityHours = roundDisplayStat(
    capRows.reduce((s, r) => s + Number(r.net_capacity_hours), 0)
  )
  const totalPlannedHours = roundDisplayStat(
    planRows.reduce((s, r) => s + Number(r.planned_hours ?? 0), 0)
  )
  const plannedUtilizationPctValue = plannedPct(totalPlannedHours, netCapacityHours)
  const projectsWithPlansCount = new Set(
    planRows.filter((r) => r.project_id != null).map((r) => r.project_id!)
  ).size
  const planVsCapacityGapHours = roundDisplayStat(netCapacityHours - totalPlannedHours)

  // Project aggregation
  type ProjectAgg = { hours: number; persons: Set<string> }
  const byProjectId = new Map<string, ProjectAgg>()
  for (const r of planRows) {
    if (!r.project_id) continue
    let agg = byProjectId.get(r.project_id)
    if (!agg) {
      agg = { hours: 0, persons: new Set() }
      byProjectId.set(r.project_id, agg)
    }
    agg.hours += Number(r.planned_hours ?? 0)
    agg.persons.add(r.person_id)
  }

  // Fetch project metadata for referenced project IDs
  const projectIds = Array.from(byProjectId.keys())
  let projectMeta: ProjectMeta[] = []
  if (projectIds.length > 0) {
    const BATCH = 200
    for (let i = 0; i < projectIds.length; i += BATCH) {
      const slice = projectIds.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from('dim_project')
        .select('id, project_key, project_name, project_type, is_commercial')
        .in('id', slice)
      if (error) return { data: null, error: error.message }
      projectMeta.push(...((data as ProjectMeta[]) ?? []))
    }
  }

  const projectMetaById = new Map(projectMeta.map((p) => [p.id, p]))

  const byProject: PlanningProjectRow[] = projectIds
    .map((pid) => {
      const agg = byProjectId.get(pid)!
      const meta = projectMetaById.get(pid)
      return {
        projectId: pid,
        projectKey: meta?.project_key ?? pid,
        projectName: meta?.project_name ?? meta?.project_key ?? pid,
        projectType: meta?.project_type ?? 'internal',
        isCommercial: meta?.is_commercial ?? false,
        plannedHours: roundDisplayStat(agg.hours),
        distinctPersonCount: agg.persons.size,
      }
    })
    .sort((a, b) => b.plannedHours - a.plannedHours)

  // Role aggregation
  const capacityPersonIds = capRows.map((r) => r.person_id)
  const { roleByPerson, error: roleErr } = await fetchMonthRolesForPeople(supabase, {
    snapshotId: snapshot.id,
    monthStartStr,
    monthEndStr,
    personIds: capacityPersonIds,
  })
  if (roleErr) return { data: null, error: roleErr }

  const { data: allRoles, error: roleMetaErr } = await supabase
    .from('dim_role')
    .select('id, key, label')
  if (roleMetaErr) return { data: null, error: roleMetaErr.message }

  const roleMeta = new Map(
    (allRoles ?? []).map((r: { id: string; key: string; label: string }) => [
      r.id,
      { key: r.key, label: r.label },
    ])
  )

  const capByPerson = new Map<string, number>()
  for (const r of capRows) {
    capByPerson.set(r.person_id, (capByPerson.get(r.person_id) ?? 0) + Number(r.net_capacity_hours))
  }

  const plannedByPerson = new Map<string, number>()
  for (const r of planRows) {
    plannedByPerson.set(
      r.person_id,
      (plannedByPerson.get(r.person_id) ?? 0) + Number(r.planned_hours ?? 0)
    )
  }

  type RoleAgg = { headcount: number; planned: number; capacity: number }
  const byRoleId = new Map<string, RoleAgg>()

  for (const pid of capacityPersonIds) {
    const rid = roleByPerson.get(pid) ?? null
    const k = rid ?? '__none__'
    let agg = byRoleId.get(k)
    if (!agg) {
      agg = { headcount: 0, planned: 0, capacity: 0 }
      byRoleId.set(k, agg)
    }
    agg.headcount += 1
    agg.capacity += capByPerson.get(pid) ?? 0
    agg.planned += plannedByPerson.get(pid) ?? 0
  }

  const byRole: PlanningRoleRow[] = Array.from(byRoleId.entries())
    .map(([k, agg]) => {
      const rid = k === '__none__' ? null : k
      const meta = rid ? roleMeta.get(rid) : null
      const netCap = roundDisplayStat(agg.capacity)
      const planned = roundDisplayStat(agg.planned)
      return {
        roleKey: meta?.key ?? 'unassigned',
        roleLabel: meta?.label ?? 'Unassigned',
        headcount: agg.headcount,
        plannedHours: planned,
        netCapacityHours: netCap,
        plannedPct: plannedPct(planned, netCap),
      }
    })
    .sort((a, b) => b.netCapacityHours - a.netCapacityHours)

  return {
    data: {
      monthLabel,
      snapshotId: snapshot.id,
      netCapacityHours,
      totalPlannedHours,
      plannedUtilizationPct: plannedUtilizationPctValue,
      projectsWithPlansCount,
      planVsCapacityGapHours,
      byRole,
      byProject,
    },
    error: null,
  }
}
