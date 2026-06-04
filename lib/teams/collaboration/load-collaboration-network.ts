import { cacheLife, cacheTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns'

import { CACHE_TAG_OVERVIEW_MONTHS } from '@/lib/data/cache-tags'
import {
  loadFragmentationByPerson,
  type FragmentationFactRow,
} from '@/lib/data/load-fragmentation-by-person'
import {
  loadOverviewMonthOptions,
  resolveSelectedOverviewMonth,
  type OverviewMonthOption,
} from '@/lib/overview/overview-month-options'
import { createServiceClientCached } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { fetchMonthRolesForPeople } from '@/lib/workforce/month-role'
import {
  buildCollaborationGraph,
  type ParticipationRecord,
  type PersonMeta,
} from '@/lib/teams/collaboration/build-collaboration-graph'
import {
  COLLABORATION_CATEGORY_ALL,
  type CollaborationRouteFilters,
} from '@/lib/teams/collaboration/collaboration-route-filters'
import { formatProjectTypeLabel } from '@/lib/teams/collaboration/collaboration-ui-utils'
import type {
  CollaborationCategoryOption,
  CollaborationNetworkPayload,
  CollaborationProjectRef,
} from '@/lib/teams/collaboration/collaboration-types'

const PAGE = 1000
const BATCH = 200
const MONTH_PICKER_LIMIT = 12

/** Last 12 calendar months that have a row in `v_dashboard_month_options`. */
function monthPickerOptions(options: OverviewMonthOption[]): OverviewMonthOption[] {
  const allowed = new Set(
    Array.from({ length: MONTH_PICKER_LIMIT }, (_, i) =>
      format(subMonths(startOfMonth(new Date()), i), 'yyyy-MM')
    )
  )
  return options.filter((option) => allowed.has(option.monthKey))
}

type PlanRow = {
  person_id: string
  project_id: string
  month_date: string
  role_id: string | null
}

type PersonProjectAgg = {
  firstMonth: string
  lastMonth: string
  activeInAnchorMonth: boolean
}

type CachedGraph = {
  nodes: CollaborationNetworkPayload['nodes']
  edges: CollaborationNetworkPayload['edges']
  projects: CollaborationNetworkPayload['projects']
  matrix: CollaborationNetworkPayload['matrix']
  kpis: CollaborationNetworkPayload['kpis']
  insights: CollaborationNetworkPayload['insights']
  categoryOptions: CollaborationCategoryOption[]
}

async function pagedPlansForMonth(
  supabase: SupabaseClient<Database>,
  snapshotId: string,
  monthStartStr: string
): Promise<{ rows: PlanRow[]; error: string | null }> {
  const rows: PlanRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('fact_plans')
      .select('person_id, project_id, month_date, role_id')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .not('project_id', 'is', null)
      .gt('planned_hours', 0)
      .order('person_id')
      .range(from, from + PAGE - 1)

    if (error) return { rows: [], error: error.message }
    const batch = (data as PlanRow[] | null) ?? []
    rows.push(...batch)
    if (batch.length < PAGE) break
    from += PAGE
  }
  return { rows, error: null }
}

async function loadCollaborationGraphData(
  selected: OverviewMonthOption,
  category: string
): Promise<{ data: CachedGraph | null; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_OVERVIEW_MONTHS)

  const supabase = createServiceClientCached()
  const aggByPersonProject = new Map<string, PersonProjectAgg>()
  const personIds = new Set<string>()
  const projectIds = new Set<string>()
  const stampedRoleIdByPerson = new Map<string, string>()

  const planResult = await pagedPlansForMonth(
    supabase,
    selected.snapshotId,
    selected.monthStartStr
  )
  if (planResult.error) {
    return { data: null, error: `fact_plans: ${planResult.error}` }
  }

  for (const row of planResult.rows) {
    if (!row.person_id || !row.project_id) continue
    personIds.add(row.person_id)
    projectIds.add(row.project_id)

    if (row.role_id) {
      stampedRoleIdByPerson.set(row.person_id, row.role_id)
    }

    const key = `${row.person_id}|${row.project_id}`
    const existing = aggByPersonProject.get(key)
    if (existing) {
      if (row.month_date < existing.firstMonth) existing.firstMonth = row.month_date
      if (row.month_date > existing.lastMonth) existing.lastMonth = row.month_date
      existing.activeInAnchorMonth = true
    } else {
      aggByPersonProject.set(key, {
        firstMonth: row.month_date,
        lastMonth: row.month_date,
        activeInAnchorMonth: true,
      })
    }
  }

  const anchorEndStr = format(
    endOfMonth(parse(selected.monthStartStr, 'yyyy-MM-dd', new Date())),
    'yyyy-MM-dd'
  )
  const monthRolesResult = await fetchMonthRolesForPeople(supabase, {
    snapshotId: selected.snapshotId,
    monthStartStr: selected.monthStartStr,
    monthEndStr: anchorEndStr,
    personIds: Array.from(personIds),
  })
  if (monthRolesResult.error) {
    return { data: null, error: monthRolesResult.error }
  }
  for (const [personId, roleId] of monthRolesResult.roleByPerson) {
    if (roleId && !stampedRoleIdByPerson.has(personId)) {
      stampedRoleIdByPerson.set(personId, roleId)
    }
  }

  const [projectsById, peopleById] = await Promise.all([
    loadProjects(supabase, Array.from(projectIds)),
    loadPeople(supabase, Array.from(personIds), stampedRoleIdByPerson),
  ])
  if (projectsById.error) return { data: null, error: projectsById.error }
  if (peopleById.error) return { data: null, error: peopleById.error }

  const presentTypes = new Set<string>()
  for (const ref of projectsById.map.values()) {
    presentTypes.add(ref.type)
  }
  const categoryOptions: CollaborationCategoryOption[] = [
    { value: COLLABORATION_CATEGORY_ALL, label: 'All' },
    ...Array.from(presentTypes)
      .sort((a, b) => a.localeCompare(b, 'en'))
      .map((type) => ({ value: type, label: formatProjectTypeLabel(type) })),
  ]

  const participations: ParticipationRecord[] = []
  for (const [key, agg] of aggByPersonProject) {
    const [personId, projectId] = key.split('|') as [string, string]
    if (!projectsById.map.has(projectId)) continue
    participations.push({
      personId,
      projectId,
      firstLog: agg.firstMonth,
      lastLog: agg.lastMonth,
      loggedInAnchorMonth: agg.activeInAnchorMonth,
    })
  }

  const fragResult = await loadFragmentationByPerson(
    selected.snapshotId,
    selected.monthStartStr
  )
  if (fragResult.error) {
    return { data: null, error: `fact_fragmentation: ${fragResult.error}` }
  }

  const graph = buildCollaborationGraph({
    participations,
    peopleById: peopleById.map,
    projectsById: projectsById.map,
    category,
    fragmentationByPerson: fragResult.byPerson,
  })

  return {
    data: {
      nodes: graph.nodes,
      edges: graph.edges,
      projects: graph.projects,
      matrix: graph.matrix,
      kpis: graph.kpis,
      insights: graph.insights,
      categoryOptions,
    },
    error: null,
  }
}

async function loadProjects(
  supabase: SupabaseClient<Database>,
  projectIds: string[]
): Promise<{ map: Map<string, CollaborationProjectRef>; error: string | null }> {
  const map = new Map<string, CollaborationProjectRef>()
  for (let i = 0; i < projectIds.length; i += BATCH) {
    const slice = projectIds.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('dim_project')
      .select('id, project_key, project_name, project_type')
      .in('id', slice)
    if (error) return { map, error: `dim_project: ${error.message}` }
    for (const row of data ?? []) {
      map.set(row.id, {
        id: row.id,
        key: row.project_key,
        name: row.project_name,
        type: row.project_type,
      })
    }
  }
  return { map, error: null }
}

async function loadPeople(
  supabase: SupabaseClient<Database>,
  personIds: string[],
  stampedRoleIdByPerson: Map<string, string>
): Promise<{ map: Map<string, PersonMeta>; error: string | null }> {
  const map = new Map<string, PersonMeta>()
  if (personIds.length === 0) return { map, error: null }

  const [rolesResult, zonesResult] = await Promise.all([
    supabase.from('dim_role').select('id, key, label'),
    supabase.from('dim_zone').select('id, key, label'),
  ])
  if (rolesResult.error) return { map, error: `dim_role: ${rolesResult.error.message}` }
  if (zonesResult.error) return { map, error: `dim_zone: ${zonesResult.error.message}` }

  const roleById = new Map((rolesResult.data ?? []).map((r) => [r.id, { key: r.key, label: r.label }]))
  const zoneById = new Map((zonesResult.data ?? []).map((z) => [z.id, { key: z.key, label: z.label }]))

  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('dim_person')
      .select('id, name, role_id, zone_id, is_active')
      .in('id', slice)
    if (error) return { map, error: `dim_person: ${error.message}` }
    for (const row of data ?? []) {
      const resolvedRoleId = stampedRoleIdByPerson.get(row.id) ?? row.role_id
      const role = resolvedRoleId ? roleById.get(resolvedRoleId) : null
      const zone = row.zone_id ? zoneById.get(row.zone_id) : null
      map.set(row.id, {
        id: row.id,
        name: row.name,
        roleKey: role?.key ?? 'unassigned',
        roleLabel: role?.label ?? 'Unassigned',
        zoneKey: zone?.key ?? null,
        zoneLabel: zone?.label ?? null,
        isActive: row.is_active,
      })
    }
  }
  return { map, error: null }
}

function resolveFocusPersonId(
  nodes: CollaborationNetworkPayload['nodes'],
  personQuery: string | null
): string | null {
  if (!personQuery) return null
  const needle = personQuery.toLowerCase()
  const exact = nodes.find((node) => node.name.toLowerCase() === needle)
  if (exact) return exact.id
  const partial = nodes.find((node) => node.name.toLowerCase().includes(needle))
  return partial?.id ?? null
}

/**
 * Loads the collaboration network for `/teams/collaboration-network`.
 *
 * Collaboration edges come from **planned co-staffing** (`fact_plans`): two people
 * share an edge when both have `planned_hours > 0` on the same project in the same
 * month (latest snapshot per month). This matches intended team composition, not
 * logged time.
 *
 * **Supabase queries and graph build:** [docs/COLLABORATION_NETWORK_DATA.md](../../docs/COLLABORATION_NETWORK_DATA.md)
 */
export async function loadCollaborationNetwork(
  filters: CollaborationRouteFilters
): Promise<{ data: CollaborationNetworkPayload | null; error: string | null }> {
  const { monthParam, category, personQuery } = filters

  const { options, error: monthsError } = await loadOverviewMonthOptions()
  if (monthsError) return { data: null, error: monthsError }

  const monthOptions = monthPickerOptions(options)
  if (monthOptions.length === 0) return { data: null, error: null }

  const selected = resolveSelectedOverviewMonth(monthOptions, monthParam)
  if (!selected) return { data: null, error: null }

  const graphResult = await loadCollaborationGraphData(selected, category)
  if (graphResult.error) return { data: null, error: graphResult.error }
  if (!graphResult.data) return { data: null, error: null }

  const graph = graphResult.data
  const focusPersonId = resolveFocusPersonId(graph.nodes, personQuery)

  return {
    data: {
      monthKey: selected.monthKey,
      monthLabel: selected.label,
      monthOptions,
      category,
      categoryOptions: graph.categoryOptions,
      personQuery,
      focusPersonId,
      nodes: graph.nodes,
      edges: graph.edges,
      projects: graph.projects,
      matrix: graph.matrix,
      kpis: graph.kpis,
      insights: graph.insights,
      syncCreatedAt: selected.syncCreatedAt,
    },
    error: null,
  }
}
