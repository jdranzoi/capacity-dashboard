import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { endOfMonth, format, parse } from 'date-fns'

import { buildUpcomingAvailabilityByThreshold } from '@/lib/capacity/planning/build-upcoming-availability'
import {
  buildPlanningMonthKpis,
  buildPlanningPeopleTree,
  buildPlanningProjectTree,
} from '@/lib/capacity/planning/build-planning-trees'
import { buildPlanningNodeMetrics } from '@/lib/capacity/planning/planning-metrics'
import { resolvePlanningPeriod } from '@/lib/capacity/planning/planning-route-period'
import type {
  CapacityPlanningWorkspacePayload,
  PlanningMonthFacts,
  PlanningMonthPersonFact,
  PlanningMonthProjectMeta,
} from '@/lib/capacity/planning/planning-types'
import { pagedQuery } from '@/lib/data/paged-query'
import { getMonthFactBundle } from '@/lib/data/load-month-fact-bundle'
import { CACHE_TAG_MONTH_FACTS, cacheTagSnapshot } from '@/lib/data/cache-tags'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { loadPlanningMonthOptions } from '@/lib/capacity/planning/load-planning-month-options'
import { fetchPlanningMonthRolesForPeople } from '@/lib/capacity/planning/resolve-planning-month-roles'
import { createServiceClientCached } from '@/lib/supabase/server'
import { isProjectSpaceType } from '@/lib/domain/project-types'

const PAGE = 1000

type ProjectPlanRow = {
  person_id: string
  project_id: string | null
  planned_hours: number
}

type PersonRow = { id: string; name: string | null }

type RoleRow = { id: string; key: string; label: string }

async function loadProjectGrainPlans(
  snapshotId: string,
  monthStartStr: string
): Promise<{ rows: ProjectPlanRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_FACTS, cacheTagSnapshot(snapshotId))

  const supabase = createServiceClientCached()
  const result = await pagedQuery<ProjectPlanRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, project_id, planned_hours')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .order('person_id')
      .range(from, from + PAGE - 1)
  )

  if (result.error) return { rows: [], error: result.error }
  return { rows: result.rows, error: null }
}

export async function loadMonthFacts(
  monthKey: string,
  monthStartStr: string,
  monthLabel: string,
  snapshotId: string
): Promise<{ data: PlanningMonthFacts | null; error: string | null }> {
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
  const supabase = createServiceClientCached()

  const [bundleResult, planRowsResult] = await Promise.all([
    getMonthFactBundle(snapshotId, monthStartStr, monthEndStr),
    loadProjectGrainPlans(snapshotId, monthStartStr),
  ])

  if (bundleResult.error || !bundleResult.data) {
    return { data: null, error: bundleResult.error ?? 'Could not load month facts.' }
  }
  if (planRowsResult.error) {
    return { data: null, error: planRowsResult.error }
  }

  const capRows = bundleResult.data.capacity
  const planRows = planRowsResult.rows
  const capacityPersonIds = capRows.map((r) => r.person_id)

  const { roleByPerson, error: roleErr } = await fetchPlanningMonthRolesForPeople(supabase, {
    snapshotId,
    monthStartStr,
    monthEndStr,
    personIds: capacityPersonIds,
  })
  if (roleErr) return { data: null, error: roleErr }

  const { data: allRoles, error: roleMetaErr } = await supabase
    .from('dim_role')
    .select('id, key, label')
  if (roleMetaErr) return { data: null, error: roleMetaErr.message }

  const roleMeta = new Map((allRoles as RoleRow[] | null)?.map((r) => [r.id, r]) ?? [])

  const personIds = new Set(capacityPersonIds)
  let personMeta: PersonRow[] = []
  if (personIds.size > 0) {
    const ids = Array.from(personIds)
    const BATCH = 200
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH)
      const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)
      if (error) return { data: null, error: error.message }
      personMeta.push(...((data as PersonRow[]) ?? []))
    }
  }
  const personNameById = new Map(personMeta.map((p) => [p.id, p.name ?? p.id]))

  const plannedByPerson = new Map<string, number>()
  const plannedByPersonProject = new Map<string, Map<string, number>>()
  const projectIds = new Set<string>()

  for (const row of planRows) {
    const hours = Number(row.planned_hours ?? 0)
    plannedByPerson.set(row.person_id, (plannedByPerson.get(row.person_id) ?? 0) + hours)
    if (row.project_id) {
      projectIds.add(row.project_id)
      let byProject = plannedByPersonProject.get(row.person_id)
      if (!byProject) {
        byProject = new Map()
        plannedByPersonProject.set(row.person_id, byProject)
      }
      byProject.set(row.project_id, (byProject.get(row.project_id) ?? 0) + hours)
    }
  }

  const projects = new Map<string, PlanningMonthProjectMeta>()
  if (projectIds.size > 0) {
    const ids = Array.from(projectIds)
    const BATCH = 200
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from('dim_project')
        .select('id, project_key, project_name, project_type')
        .in('id', slice)
      if (error) return { data: null, error: error.message }
      for (const p of (data as {
        id: string
        project_key: string
        project_name: string | null
        project_type: string
      }[]) ?? []) {
        projects.set(p.id, {
          projectId: p.id,
          projectKey: p.project_key,
          projectName: p.project_name ?? p.project_key,
          projectType: isProjectSpaceType(p.project_type) ? p.project_type : null,
        })
      }
    }
  }

  const capByPerson = new Map<string, number>()
  for (const row of capRows) {
    capByPerson.set(
      row.person_id,
      (capByPerson.get(row.person_id) ?? 0) + Number(row.net_capacity_hours)
    )
  }

  const people: PlanningMonthPersonFact[] = capacityPersonIds.map((personId) => {
    const roleId = roleByPerson.get(personId) ?? null
    const role = roleId ? roleMeta.get(roleId) : undefined
    return {
      personId,
      personName: personNameById.get(personId) ?? personId,
      roleId,
      roleKey: role?.key ?? '',
      roleLabel: role?.label ?? '',
      netCapacityHours: roundDisplayStat(capByPerson.get(personId) ?? 0),
      plannedHours: roundDisplayStat(plannedByPerson.get(personId) ?? 0),
      plannedByProject: plannedByPersonProject.get(personId) ?? new Map(),
    }
  })

  return {
    data: {
      monthKey,
      monthLabel,
      monthStartStr,
      snapshotId,
      people,
      projects,
    },
    error: null,
  }
}

export const loadPlanningWorkspaceCached = cache(
  async (
    fromParam?: string,
    toParam?: string
  ): Promise<{ data: CapacityPlanningWorkspacePayload | null; error: string | null }> =>
    loadPlanningWorkspace({ fromParam, toParam })
)

export async function loadPlanningWorkspace(params: {
  fromParam?: string
  toParam?: string
}): Promise<{ data: CapacityPlanningWorkspacePayload | null; error: string | null }> {
  const { options, error: optErr } = await loadPlanningMonthOptions()
  if (optErr) return { data: null, error: optErr }

  const period = resolvePlanningPeriod(options, params.fromParam, params.toParam)
  if (!period) return { data: null, error: null }

  const optionByKey = new Map(options.map((o) => [o.monthKey, o]))
  const monthResults = await Promise.all(
    period.monthKeys.map(async (monthKey) => {
      const opt = optionByKey.get(monthKey)
      if (!opt) return { data: null as PlanningMonthFacts | null, error: `Missing month ${monthKey}` }
      return loadMonthFacts(monthKey, opt.monthStartStr, opt.label, opt.snapshotId)
    })
  )

  for (const result of monthResults) {
    if (result.error) return { data: null, error: result.error }
  }

  const monthFacts = monthResults.map((r) => r.data!).filter(Boolean)
  if (monthFacts.length === 0) return { data: null, error: null }

  return {
    data: {
      period,
      monthKpis: buildPlanningMonthKpis(period, monthFacts),
      peopleTreeRows: buildPlanningPeopleTree(period, monthFacts),
      projectTreeRows: buildPlanningProjectTree(period, monthFacts),
      upcomingAvailabilityByThreshold: buildUpcomingAvailabilityByThreshold(
        monthFacts,
        period.monthLabels
      ),
    },
    error: null,
  }
}

export function getMockPlanningWorkspace(): CapacityPlanningWorkspacePayload {
  const monthKeys = ['2026-06', '2026-07', '2026-08', '2026-09']
  const monthLabels: Record<string, string> = {
    '2026-06': 'Jun 2026',
    '2026-07': 'Jul 2026',
    '2026-08': 'Aug 2026',
    '2026-09': 'Sep 2026',
  }

  const period = { fromMonthKey: '2026-06', toMonthKey: '2026-09', monthKeys, monthLabels }

  const m = (net: number, planned: number) => buildPlanningNodeMetrics(net, planned)

  const peopleTreeRows: CapacityPlanningWorkspacePayload['peopleTreeRows'] = [
    {
      id: 'role:tl',
      kind: 'role',
      label: 'Technical Lead',
      depth: 0,
      roleKey: 'tl',
      months: {
        '2026-06': m(320, 288),
        '2026-07': m(320, 300),
        '2026-08': m(320, 272),
        '2026-09': m(320, 256),
      },
      subRows: [
        {
          id: 'person:sarah',
          kind: 'person',
          label: 'Sarah Kim',
          depth: 1,
          roleKey: 'tl',
          personId: 'p1',
          months: {
            '2026-06': m(160, 152),
            '2026-07': m(160, 156),
            '2026-08': m(160, 140),
            '2026-09': m(160, 128),
          },
        },
        {
          id: 'person:julian',
          kind: 'person',
          label: 'Julian Cerutti',
          depth: 1,
          roleKey: 'tl',
          personId: 'p2',
          months: {
            '2026-06': m(160, 136),
            '2026-07': m(160, 144),
            '2026-08': m(160, 132),
            '2026-09': m(160, 128),
          },
        },
      ],
    },
    {
      id: 'role:fed',
      kind: 'role',
      label: 'Full Stack Developer',
      depth: 0,
      roleKey: 'fed',
      months: {
        '2026-06': m(640, 560),
        '2026-07': m(640, 592),
        '2026-08': m(640, 520),
        '2026-09': m(640, 480),
      },
      subRows: [
        {
          id: 'person:ana',
          kind: 'person',
          label: 'Ana Silva',
          depth: 1,
          roleKey: 'fed',
          personId: 'p3',
          months: {
            '2026-06': m(160, 120),
            '2026-07': m(160, 112),
            '2026-08': m(160, 80),
            '2026-09': m(160, 64),
          },
        },
        {
          id: 'person:mike',
          kind: 'person',
          label: 'Mike Ross',
          depth: 1,
          roleKey: 'fed',
          personId: 'p4',
          months: {
            '2026-06': m(160, 148),
            '2026-07': m(160, 152),
            '2026-08': m(160, 144),
            '2026-09': m(160, 136),
          },
        },
      ],
    },
  ]

  const p = (hours: number) => ({ plannedHours: hours })

  const projectTreeRows: CapacityPlanningWorkspacePayload['projectTreeRows'] = [
    {
      id: 'project:nike',
      kind: 'project',
      label: 'Nike Replatform',
      depth: 0,
      projectId: 'proj1',
      projectType: 'build',
      months: {
        '2026-06': p(420),
        '2026-07': p(440),
        '2026-08': p(400),
        '2026-09': p(380),
      },
      subRows: [
        {
          id: 'role:nike:tl',
          kind: 'role',
          label: 'Technical Lead',
          depth: 1,
          projectId: 'proj1',
          roleKey: 'tl',
          months: {
            '2026-06': p(152),
            '2026-07': p(156),
            '2026-08': p(140),
            '2026-09': p(128),
          },
          subRows: [
            {
              id: 'person:nike:sarah',
              kind: 'person',
              label: 'Sarah Kim',
              depth: 2,
              projectId: 'proj1',
              roleKey: 'tl',
              personId: 'p1',
              months: {
                '2026-06': p(152),
                '2026-07': p(156),
                '2026-08': p(140),
                '2026-09': p(128),
              },
            },
          ],
        },
      ],
    },
  ]

  return {
    period,
    monthKpis: monthKeys.map((monthKey) => ({
      monthKey,
      monthLabel: monthLabels[monthKey]!,
      ...m(3120, 2732),
    })),
    peopleTreeRows,
    projectTreeRows,
    upcomingAvailabilityByThreshold: {
      lt40: [
        {
          monthKey: '2026-07',
          monthLabel: 'Jul 2026',
          roleCode: 'FSD',
          roleLabel: 'Full Stack Developer',
          headcount: 2,
        },
        {
          monthKey: '2026-08',
          monthLabel: 'Aug 2026',
          roleCode: 'QA',
          roleLabel: 'QA Tester',
          headcount: 1,
        },
      ],
      lt60: [
        {
          monthKey: '2026-07',
          monthLabel: 'Jul 2026',
          roleCode: 'FSD',
          roleLabel: 'Full Stack Developer',
          headcount: 2,
        },
        {
          monthKey: '2026-08',
          monthLabel: 'Aug 2026',
          roleCode: 'QA',
          roleLabel: 'QA Tester',
          headcount: 1,
        },
      ],
      lt80: [
        {
          monthKey: '2026-07',
          monthLabel: 'Jul 2026',
          roleCode: 'FSD',
          roleLabel: 'Full Stack Developer',
          headcount: 3,
        },
        {
          monthKey: '2026-08',
          monthLabel: 'Aug 2026',
          roleCode: 'QA',
          roleLabel: 'QA Tester',
          headcount: 2,
        },
      ],
    },
  }
}
