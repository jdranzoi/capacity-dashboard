import { cacheLife, cacheTag } from 'next/cache'

import { CACHE_TAG_MONTH_FACTS, CACHE_TAG_MONTH_OPS } from '@/lib/data/cache-tags'
import { pagedQuery } from '@/lib/data/paged-query'
import { createServiceClientCached } from '@/lib/supabase/server'

const PAGE = 1000
const BATCH = 200

/** Contractor hours of one month, person and project. Never part of capacity KPIs (D-032, D-035). */
export type ContractorMonthHoursRow = {
  month_date: string
  person_id: string
  person_name: string
  project_id: string
  project_label: string
  planned_hours: number
  logged_hours: number
}

/**
 * Contractor delivery plans and non-PTO worklogs per month, person and project.
 *
 * Plans: `fact_plans` rows outside the capacity population (`in_population = false`), read
 * from the snapshot given for each month, the same one the population's Planned comes from.
 * Snapshots written before migration 034 hold no contractor plans.
 * Worklogs: people flagged `dim_person.is_contractor`.
 */
export async function loadContractorMonthHours(
  snapshotByMonth: Record<string, string>
): Promise<{ rows: ContractorMonthHoursRow[]; error: string | null }> {
  'use cache'
  cacheLife({ stale: 120, revalidate: 300 })
  cacheTag(CACHE_TAG_MONTH_OPS, CACHE_TAG_MONTH_FACTS)

  const months = Object.keys(snapshotByMonth).sort()
  if (months.length === 0) return { rows: [], error: null }
  const snapshotIds = [...new Set(Object.values(snapshotByMonth))]

  const supabase = createServiceClientCached()
  const [contractors, plans] = await Promise.all([
    supabase.from('dim_person').select('id, name').eq('is_contractor', true),
    pagedQuery<{
      snapshot_id: string
      month_date: string
      person_id: string
      project_id: string | null
      planned_hours: number
    }>(async (from) =>
      supabase
        .from('fact_plans')
        .select('snapshot_id, month_date, person_id, project_id, planned_hours')
        .in('snapshot_id', snapshotIds)
        .eq('in_population', false)
        .eq('plan_kind', 'delivery')
        .order('id')
        .range(from, from + PAGE - 1)
    ),
  ])
  if (contractors.error) return { rows: [], error: contractors.error.message }
  if (plans.error) return { rows: [], error: `fact_plans (contractors): ${plans.error}` }

  const nameById = new Map((contractors.data ?? []).map((row) => [row.id, row.name]))
  const contractorIds = [...nameById.keys()]
  const worklogs =
    contractorIds.length === 0
      ? { rows: [], error: null }
      : await pagedQuery<{
          log_date: string
          person_id: string
          project_id: string
          logged_seconds: number
        }>(async (from) =>
          supabase
            .from('fact_worklogs')
            .select('log_date, person_id, project_id, logged_seconds')
            .in('person_id', contractorIds)
            .eq('is_pto', false)
            .gte('log_date', months[0])
            .order('id')
            .range(from, from + PAGE - 1)
        )
  if (worklogs.error) return { rows: [], error: `fact_worklogs (contractors): ${worklogs.error}` }

  const byKey = new Map<string, Omit<ContractorMonthHoursRow, 'person_name' | 'project_label'>>()
  const add = (month: string, personId: string, projectId: string, planned: number, logged: number) => {
    const key = `${month}|${personId}|${projectId}`
    const row = byKey.get(key) ?? {
      month_date: month,
      person_id: personId,
      project_id: projectId,
      planned_hours: 0,
      logged_hours: 0,
    }
    row.planned_hours += planned
    row.logged_hours += logged
    byKey.set(key, row)
  }
  for (const plan of plans.rows) {
    if (!plan.project_id || snapshotByMonth[plan.month_date] !== plan.snapshot_id) continue
    add(plan.month_date, plan.person_id, plan.project_id, Number(plan.planned_hours) || 0, 0)
  }
  for (const log of worklogs.rows) {
    add(`${log.log_date.slice(0, 7)}-01`, log.person_id, log.project_id, 0, (Number(log.logged_seconds) || 0) / 3600)
  }

  // Plans keep people who were contractors when planned, even if the flag changed since.
  const rows = [...byKey.values()]
  const missingPeople = [...new Set(rows.map((row) => row.person_id))].filter((id) => !nameById.has(id))
  const projectIds = [...new Set(rows.map((row) => row.project_id))]
  const labelByProject = new Map<string, string>()
  for (let i = 0; i < Math.max(missingPeople.length, projectIds.length); i += BATCH) {
    const people = missingPeople.slice(i, i + BATCH)
    const projects = projectIds.slice(i, i + BATCH)
    const [peopleRes, projectRes] = await Promise.all([
      people.length > 0
        ? supabase.from('dim_person').select('id, name').in('id', people)
        : Promise.resolve({ data: [], error: null }),
      projects.length > 0
        ? supabase.from('dim_project').select('id, project_key, project_name').in('id', projects)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (peopleRes.error) return { rows: [], error: peopleRes.error.message }
    if (projectRes.error) return { rows: [], error: projectRes.error.message }
    for (const person of peopleRes.data ?? []) nameById.set(person.id, person.name)
    for (const project of projectRes.data ?? []) {
      labelByProject.set(
        project.id,
        project.project_name ? `${project.project_key} · ${project.project_name}` : project.project_key
      )
    }
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      person_name: nameById.get(row.person_id) ?? row.person_id,
      project_label: labelByProject.get(row.project_id) ?? row.project_id,
    })),
    error: null,
  }
}
