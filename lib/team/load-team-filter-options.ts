import { endOfMonth, format, parse } from 'date-fns'

import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000

export type TeamFilterSelectOption = {
  value: string
  label: string
}

export type TeamFilterOptionsPayload = {
  roles: TeamFilterSelectOption[]
  zones: TeamFilterSelectOption[]
  projects: TeamFilterSelectOption[]
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

export async function loadTeamFilterOptions(
  snapshotId: string,
  monthStartStr: string
): Promise<{ data: TeamFilterOptionsPayload | null; error: string | null }> {
  const monthStart = parse(monthStartStr, 'yyyy-MM-dd', new Date())
  const monthEndStr = format(endOfMonth(monthStart), 'yyyy-MM-dd')

  try {
    const supabase = createServiceClientCached()

    const { rows: capRows, error: capErr } = await pagedQuery<{ person_id: string }>(
      async (from) =>
        supabase
          .from('fact_capacity')
          .select('person_id')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .order('person_id')
          .range(from, from + PAGE - 1)
    )
    if (capErr) return { data: null, error: capErr }

    const capacityPersonIds = new Set(capRows.map((r) => r.person_id))
    const roleIds = new Set<string>()
    const zoneIds = new Set<string>()

    const personList = Array.from(capacityPersonIds)
    const BATCH = 200
    for (let i = 0; i < personList.length; i += BATCH) {
      const slice = personList.slice(i, i + BATCH)
      const { data: people, error: pErr } = await supabase
        .from('dim_person')
        .select('role_id, zone_id')
        .in('id', slice)
      if (pErr) return { data: null, error: pErr.message }
      for (const row of people ?? []) {
        if (row.role_id) roleIds.add(row.role_id)
        if (row.zone_id) zoneIds.add(row.zone_id)
      }
    }

    const [rolesRes, zonesRes] = await Promise.all([
      roleIds.size > 0
        ? supabase.from('dim_role').select('key, label').in('id', Array.from(roleIds))
        : Promise.resolve({ data: [] as { key: string; label: string }[], error: null }),
      zoneIds.size > 0
        ? supabase.from('dim_zone').select('key, label').in('id', Array.from(zoneIds))
        : Promise.resolve({ data: [] as { key: string; label: string }[], error: null }),
    ])

    if (rolesRes.error) return { data: null, error: rolesRes.error.message }
    if (zonesRes.error) return { data: null, error: zonesRes.error.message }

    const projectIds = new Set<string>()

    const { rows: planProj, error: planProjErr } = await pagedQuery<{ project_id: string | null }>(
      async (from) =>
        supabase
          .from('fact_plans')
          .select('project_id')
          .eq('snapshot_id', snapshotId)
          .eq('month_date', monthStartStr)
          .eq('is_pto', false)
          .not('project_id', 'is', null)
          .order('project_id')
          .range(from, from + PAGE - 1)
    )
    if (planProjErr) return { data: null, error: planProjErr }
    for (const r of planProj) {
      if (r.project_id) projectIds.add(r.project_id)
    }

    const { rows: logProj, error: logProjErr } = await pagedQuery<{ project_id: string }>(
      async (from) =>
        supabase
          .from('fact_worklogs')
          .select('project_id')
          .gte('log_date', monthStartStr)
          .lte('log_date', monthEndStr)
          .order('project_id')
          .range(from, from + PAGE - 1)
    )
    if (logProjErr) return { data: null, error: logProjErr }
    for (const r of logProj) {
      if (r.project_id) projectIds.add(r.project_id)
    }

    const projectOptions: TeamFilterSelectOption[] = []

    if (projectIds.size > 0) {
      const idList = Array.from(projectIds)
      for (let i = 0; i < idList.length; i += BATCH) {
        const slice = idList.slice(i, i + BATCH)
        const { data: projRows, error: projErr } = await supabase
          .from('dim_project')
          .select('project_key, project_name')
          .in('id', slice)
        if (projErr) return { data: null, error: projErr.message }
        for (const p of projRows ?? []) {
          const label = (p.project_name?.trim() || p.project_key) ?? p.project_key
          projectOptions.push({ value: p.project_key, label })
        }
      }
    }

    projectOptions.sort((a, b) => a.label.localeCompare(b.label))

    const roleOptions: TeamFilterSelectOption[] = (rolesRes.data ?? [])
      .map((r) => ({ value: r.key, label: r.label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const zoneOptions: TeamFilterSelectOption[] = (zonesRes.data ?? [])
      .map((z) => ({ value: z.key, label: z.label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return {
      data: {
        roles: roleOptions,
        zones: zoneOptions,
        projects: projectOptions,
      },
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error loading team filters.'
    return { data: null, error: message }
  }
}
