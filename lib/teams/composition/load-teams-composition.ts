import type { SupabaseClient } from '@supabase/supabase-js'
import { endOfMonth, format, parse } from 'date-fns'

import { createServiceClientCached } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { isProjectSpaceType, PROJECT_SPACE_TYPES } from '@/lib/domain/project-types'
import {
  buildMemberRoleGroups,
  buildTypeGroup as buildCompositionTypeGroup,
  PM_ROLE_KEY,
  resolvePmForMembers,
  type TeamsCompositionMember,
  type TeamsCompositionPayload,
  type TeamsCompositionProject,
} from '@/lib/teams/composition/teams-composition-utils'

const PAGE = 1000
const BATCH = 200

type PagedResult<T> = { rows: T[]; error: string | null }

type PlanAssignmentRow = {
  person_id: string
  project_id: string
  role_id: string | null
  planned_hours: number
}

type ProjectMetaRow = {
  id: string
  project_key: string
  project_name: string | null
  project_type: string
}

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

async function loadPlanAssignments(
  supabase: SupabaseClient<Database>,
  snapshotId: string,
  monthStartStr: string
): Promise<PagedResult<PlanAssignmentRow>> {
  return pagedQuery<PlanAssignmentRow>(async (from) =>
    supabase
      .from('fact_plans')
      .select('person_id, project_id, role_id, planned_hours')
      .eq('snapshot_id', snapshotId)
      .eq('month_date', monthStartStr)
      .eq('is_pto', false)
      .not('project_id', 'is', null)
      .gt('planned_hours', 0)
      .order('project_id')
      .range(from, from + PAGE - 1)
  )
}

async function loadWorklogProjectIds(
  supabase: SupabaseClient<Database>,
  monthStartStr: string,
  monthEndStr: string
): Promise<PagedResult<{ project_id: string }>> {
  return pagedQuery<{ project_id: string }>(async (from) =>
    supabase
      .from('fact_worklogs')
      .select('project_id')
      .gte('log_date', monthStartStr)
      .lte('log_date', monthEndStr)
      .eq('is_pto', false)
      .order('project_id')
      .range(from, from + PAGE - 1)
  )
}

async function loadProjectsByIds(
  supabase: SupabaseClient<Database>,
  projectIds: readonly string[]
): Promise<{ rows: ProjectMetaRow[]; error: string | null }> {
  const rows: ProjectMetaRow[] = []

  for (let i = 0; i < projectIds.length; i += BATCH) {
    const slice = projectIds.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('dim_project')
      .select('id, project_key, project_name, project_type')
      .in('id', slice)

    if (error) {
      return { rows: [], error: error.message }
    }
    rows.push(...(data ?? []))
  }

  return { rows, error: null }
}

async function loadPersonNames(
  supabase: SupabaseClient<Database>,
  personIds: readonly string[]
): Promise<{ namesById: Map<string, string>; error: string | null }> {
  const namesById = new Map<string, string>()

  for (let i = 0; i < personIds.length; i += BATCH) {
    const slice = personIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_person').select('id, name').in('id', slice)

    if (error) {
      return { namesById, error: error.message }
    }

    for (const row of data ?? []) {
      namesById.set(row.id, row.name)
    }
  }

  return { namesById, error: null }
}

async function loadRoleMeta(
  supabase: SupabaseClient<Database>,
  roleIds: readonly string[]
): Promise<{
  roleById: Map<string, { key: string; label: string }>
  pmRoleId: string | null
  error: string | null
}> {
  const roleById = new Map<string, { key: string; label: string }>()
  let pmRoleId: string | null = null

  const { data: pmRow, error: pmErr } = await supabase
    .from('dim_role')
    .select('id')
    .eq('key', PM_ROLE_KEY)
    .maybeSingle()

  if (pmErr) {
    return { roleById, pmRoleId: null, error: pmErr.message }
  }
  pmRoleId = pmRow?.id ?? null

  if (roleIds.length === 0) {
    return { roleById, pmRoleId, error: null }
  }

  for (let i = 0; i < roleIds.length; i += BATCH) {
    const slice = roleIds.slice(i, i + BATCH)
    const { data, error } = await supabase.from('dim_role').select('id, key, label').in('id', slice)

    if (error) {
      return { roleById, pmRoleId, error: error.message }
    }

    for (const row of data ?? []) {
      roleById.set(row.id, { key: row.key, label: row.label })
    }
  }

  return { roleById, pmRoleId, error: null }
}

/**
 * Project teams for `/teams/composition`.
 *
 * Active project: non-PTO plan lines or non-PTO worklogs in the reference month.
 * Card roster: plan assignments only (`planned_hours > 0`, stamped `role_id`).
 * PM sort: member with role key `pm` on that project's plan rows.
 */
export async function loadTeamsComposition(params: {
  monthStartStr: string
  monthLabel: string
  snapshot: { id: string; createdAt: string }
  personQuery?: string | null
  projectQuery?: string | null
}): Promise<{ data: TeamsCompositionPayload | null; error: string | null }> {
  const { monthStartStr, monthLabel, snapshot, personQuery, projectQuery } = params
  const snapshotId = snapshot.id
  const referenceDate = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(referenceDate), 'yyyy-MM-dd')
  const normalizedPersonQuery = personQuery?.trim() || null
  const normalizedProjectQuery = projectQuery?.trim() || null
  const filters = {
    personQuery: normalizedPersonQuery,
    projectQuery: normalizedProjectQuery,
  }

  try {
    const supabase = createServiceClientCached()

    const [planResult, worklogResult] = await Promise.all([
      loadPlanAssignments(supabase, snapshotId, monthStartStr),
      loadWorklogProjectIds(supabase, monthStartStr, monthEndStr),
    ])

    if (planResult.error) {
      return { data: null, error: `fact_plans: ${planResult.error}` }
    }
    if (worklogResult.error) {
      return { data: null, error: `fact_worklogs: ${worklogResult.error}` }
    }

    const activeProjectIds = new Set<string>()
    const membersByProject = new Map<
      string,
      Map<string, { roleId: string | null; plannedHours: number }>
    >()

    for (const row of planResult.rows) {
      activeProjectIds.add(row.project_id)
      let byPerson = membersByProject.get(row.project_id)
      if (!byPerson) {
        byPerson = new Map()
        membersByProject.set(row.project_id, byPerson)
      }

      const existing = byPerson.get(row.person_id)
      const hours = Number(row.planned_hours)
      if (!existing) {
        byPerson.set(row.person_id, { roleId: row.role_id, plannedHours: hours })
      } else {
        existing.plannedHours += hours
        if (existing.roleId == null && row.role_id != null) {
          existing.roleId = row.role_id
        }
      }
    }

    for (const row of worklogResult.rows) {
      if (row.project_id) {
        activeProjectIds.add(row.project_id)
      }
    }

    if (activeProjectIds.size === 0) {
      return {
        data: emptyPayload({
          monthLabel,
          snapshotId,
          syncCreatedAt: snapshot.createdAt,
          personQuery: normalizedPersonQuery,
          projectQuery: normalizedProjectQuery,
        }),
        error: null,
      }
    }

    const projectsResult = await loadProjectsByIds(supabase, Array.from(activeProjectIds))
    if (projectsResult.error) {
      return { data: null, error: `dim_project: ${projectsResult.error}` }
    }

    const eligibleProjects = projectsResult.rows.filter((p) =>
      isProjectSpaceType(p.project_type)
    )

    if (eligibleProjects.length === 0) {
      return {
        data: emptyPayload({
          monthLabel,
          snapshotId,
          syncCreatedAt: snapshot.createdAt,
          personQuery: normalizedPersonQuery,
          projectQuery: normalizedProjectQuery,
        }),
        error: null,
      }
    }

    const personIds = new Set<string>()
    for (const project of eligibleProjects) {
      const byPerson = membersByProject.get(project.id)
      if (!byPerson) continue
      for (const personId of byPerson.keys()) {
        personIds.add(personId)
      }
    }

    const roleIds = new Set<string>()
    for (const project of eligibleProjects) {
      const byPerson = membersByProject.get(project.id)
      if (!byPerson) continue
      for (const entry of byPerson.values()) {
        if (entry.roleId) roleIds.add(entry.roleId)
      }
    }

    const [peopleResult, rolesResult] = await Promise.all([
      loadPersonNames(supabase, Array.from(personIds)),
      loadRoleMeta(supabase, Array.from(roleIds)),
    ])

    if (peopleResult.error) {
      return { data: null, error: `dim_person: ${peopleResult.error}` }
    }
    if (rolesResult.error) {
      return { data: null, error: `dim_role: ${rolesResult.error}` }
    }

    const projectsByType = new Map<TeamsCompositionProject['projectType'], TeamsCompositionProject[]>(
      PROJECT_SPACE_TYPES.map((section) => [section.value, []])
    )

    for (const project of eligibleProjects) {
      const byPerson = membersByProject.get(project.id)
      const members: TeamsCompositionMember[] = []

      if (byPerson) {
        for (const [personId, entry] of byPerson) {
          const role = entry.roleId ? rolesResult.roleById.get(entry.roleId) : null
          const roleKey = role?.key ?? 'unassigned'
          const roleLabel = role?.label ?? 'Unassigned'
          members.push({
            personId,
            personName: peopleResult.namesById.get(personId) ?? 'Unknown',
            roleKey,
            roleLabel,
            isPm: entry.roleId != null && entry.roleId === rolesResult.pmRoleId,
          })
        }
      }

      const memberGroups = buildMemberRoleGroups(members)
      const { pmName, pmSortKey } = resolvePmForMembers(members)
      const projectType = project.project_type as TeamsCompositionProject['projectType']
      const card: TeamsCompositionProject = {
        projectId: project.id,
        projectKey: project.project_key,
        projectName: project.project_name,
        projectType,
        pmName,
        pmSortKey,
        memberGroups,
      }

      projectsByType.get(projectType)?.push(card)
    }

    const groups = PROJECT_SPACE_TYPES.map((section) =>
      buildCompositionTypeGroup(
        section.value,
        section.label,
        projectsByType.get(section.value) ?? [],
        filters
      )
    )

    const totalProjectCount = PROJECT_SPACE_TYPES.reduce(
      (sum, section) => sum + (projectsByType.get(section.value)?.length ?? 0),
      0
    )
    const visibleProjectCount = groups.reduce((sum, group) => sum + group.projects.length, 0)

    return {
      data: {
        monthLabel,
        snapshotId,
        syncCreatedAt: snapshot.createdAt,
        personQuery: normalizedPersonQuery,
        projectQuery: normalizedProjectQuery,
        groups,
        totalProjectCount,
        visibleProjectCount,
      },
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load teams composition.'
    return { data: null, error: message }
  }
}

function emptyPayload(params: {
  monthLabel: string
  snapshotId: string
  syncCreatedAt: string | null
  personQuery: string | null
  projectQuery: string | null
}): TeamsCompositionPayload {
  return {
    monthLabel: params.monthLabel,
    snapshotId: params.snapshotId,
    syncCreatedAt: params.syncCreatedAt,
    personQuery: params.personQuery,
    projectQuery: params.projectQuery,
    groups: PROJECT_SPACE_TYPES.map((section) => ({
      projectType: section.value,
      label: section.label,
      projects: [],
    })),
    totalProjectCount: 0,
    visibleProjectCount: 0,
  }
}
