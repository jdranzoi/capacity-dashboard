import { format, parse } from 'date-fns'

import { compareRoleKeysByDisplayOrder, roleKeyAcronym } from '@/lib/domain/role-keys'
import { roundDisplayStat } from '@/lib/format/display-stats'
import { TRAINING_MISSING_KEY, TRAINING_MISSING_LABEL } from '@/lib/projects/training/training-constants'
import { secondsToHours } from '@/lib/projects/training/training-metrics'
import type { TrainingYearFacts } from '@/lib/projects/training-year/load-training-year-facts'
import type { TrainingYearFilters } from '@/lib/projects/training-year/training-year-filters'
import type {
  TrainingYearCompareYear,
  TrainingYearGroupedBar,
  TrainingYearPayload,
  TrainingYearRoleCompareRow,
  TrainingYearTaxonomyRow,
} from '@/lib/projects/training-year/training-year-types'

/** Areas shown at once; the long tail of Jira components is mostly single-ticket noise. */
const TAXONOMY_AREA_LIMIT = 12

function monthPrefix(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function monthAbbrev(monthIndex: number): string {
  return format(new Date(2020, monthIndex, 1), 'MMM')
}

function throughRangeLabel(throughMonthIndex: number): string {
  if (throughMonthIndex <= 0) return 'Jan'
  return `Jan–${monthAbbrev(throughMonthIndex)}`
}

function logYear(logDate: string): number {
  return Number(logDate.slice(0, 4))
}

function logMonthIndex(logDate: string): number {
  return Number(logDate.slice(5, 7)) - 1
}

function parseMonthIndex(monthKey: string | null): number | null {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null
  const monthIndex = Number(monthKey.slice(5, 7)) - 1
  return monthIndex >= 0 && monthIndex <= 11 ? monthIndex : null
}

function roleKeyForPerson(
  personId: string,
  roleIdByPerson: Map<string, string | null>,
  roleById: Map<string, { key: string; label: string }>
): { key: string; label: string } {
  const roleId = roleIdByPerson.get(personId)
  if (!roleId) return { key: TRAINING_MISSING_KEY, label: TRAINING_MISSING_LABEL }
  const role = roleById.get(roleId)
  if (!role) return { key: TRAINING_MISSING_KEY, label: TRAINING_MISSING_LABEL }
  return role
}

function deltaPct(current: number, prior: number): number | null {
  if (prior <= 0) return null
  return ((current - prior) / prior) * 100
}

function buildTaxonomyRows(params: {
  logs: TrainingYearFacts['worklogs']
  keysByIssue: Map<string, string[]>
  currentYear: number
  priorYear: number | null
  limit?: number
}): TrainingYearTaxonomyRow[] {
  const totals = new Map<number, number>()
  const buckets = new Map<string, Map<number, number>>()

  for (const row of params.logs) {
    const rowYear = logYear(row.log_date)
    if (rowYear !== params.currentYear && rowYear !== params.priorYear) continue
    const hours = secondsToHours(row.logged_seconds)
    totals.set(rowYear, (totals.get(rowYear) ?? 0) + hours)
    for (const key of params.keysByIssue.get(row.issue_id) ?? []) {
      const bucket = buckets.get(key) ?? new Map<number, number>()
      bucket.set(rowYear, (bucket.get(rowYear) ?? 0) + hours)
      buckets.set(key, bucket)
    }
  }

  const sharePct = (hours: number, forYear: number | null) => {
    const total = forYear == null ? 0 : (totals.get(forYear) ?? 0)
    return total > 0 ? roundDisplayStat((hours / total) * 100) : 0
  }

  const rows = [...buckets.entries()]
    .map(([key, bucket]) => {
      const currentHours = bucket.get(params.currentYear) ?? 0
      const priorHours = params.priorYear == null ? 0 : (bucket.get(params.priorYear) ?? 0)
      return {
        key,
        label: key === TRAINING_MISSING_KEY ? TRAINING_MISSING_LABEL : key,
        currentHours: roundDisplayStat(currentHours),
        priorHours: roundDisplayStat(priorHours),
        currentSharePct: sharePct(currentHours, params.currentYear),
        priorSharePct: sharePct(priorHours, params.priorYear),
      }
    })
    .filter((row) => row.currentHours > 0 || row.priorHours > 0)
    .sort((a, b) => b.currentHours - a.currentHours || b.priorHours - a.priorHours)

  return params.limit == null ? rows : rows.slice(0, params.limit)
}

function collectYears(
  worklogs: TrainingYearFacts['worklogs'],
  childIds: Set<string>,
  currentYear: number
): number[] {
  const years = new Set<number>([currentYear])
  for (const row of worklogs) {
    if (!childIds.has(row.issue_id)) continue
    const year = logYear(row.log_date)
    if (Number.isFinite(year) && year > 2000 && year <= currentYear) years.add(year)
  }
  return [...years].sort((a, b) => a - b)
}

export function buildTrainingYearDashboard(
  facts: TrainingYearFacts,
  year: number,
  filters: TrainingYearFilters,
  asOf: Date = new Date()
): TrainingYearPayload {
  const childIds = new Set(facts.issues.filter((issue) => issue.is_child).map((issue) => issue.id))
  const roleIdByPerson = new Map(facts.persons.map((person) => [person.id, person.role_id]))
  const roleById = new Map(facts.roles.map((role) => [role.id, { key: role.key, label: role.label }]))
  const years = collectYears(facts.worklogs, childIds, year)
  const throughMonthIndex = asOf.getFullYear() === year ? asOf.getMonth() : 11
  const slicedMonthIndex = parseMonthIndex(filters.monthKey)
  const windowLabel =
    slicedMonthIndex != null ? monthAbbrev(slicedMonthIndex) : throughRangeLabel(throughMonthIndex)

  const childLogs = facts.worklogs.filter(
    (row) => childIds.has(row.issue_id) && years.includes(logYear(row.log_date))
  )

  const versionsByIssue = new Map<string, string[]>()
  const componentsByIssue = new Map<string, string[]>()
  for (const issue of facts.issues) {
    if (!issue.is_child) continue
    versionsByIssue.set(
      issue.id,
      issue.fix_versions?.length ? issue.fix_versions : [TRAINING_MISSING_KEY]
    )
    componentsByIssue.set(
      issue.id,
      issue.components?.length ? issue.components : [TRAINING_MISSING_KEY]
    )
  }

  const matchesRole = (row: (typeof childLogs)[number]) => {
    if (!filters.roleKey) return true
    return roleKeyForPerson(row.person_id, roleIdByPerson, roleById).key === filters.roleKey
  }

  const matchesVersion = (row: (typeof childLogs)[number]) => {
    if (!filters.versionKey) return true
    return (versionsByIssue.get(row.issue_id) ?? []).includes(filters.versionKey)
  }

  const matchesComponent = (row: (typeof childLogs)[number]) => {
    if (!filters.componentKey) return true
    return (componentsByIssue.get(row.issue_id) ?? []).includes(filters.componentKey)
  }

  const matchesTaxonomy = (row: (typeof childLogs)[number]) =>
    matchesVersion(row) && matchesComponent(row)

  const inCompareWindow = (row: (typeof childLogs)[number]) => {
    const monthIndex = logMonthIndex(row.log_date)
    if (slicedMonthIndex != null) return monthIndex === slicedMonthIndex
    return monthIndex <= throughMonthIndex
  }

  const monthLogs = childLogs.filter((row) => matchesRole(row) && matchesTaxonomy(row))
  const roleWindowLogs = childLogs.filter((row) => inCompareWindow(row) && matchesTaxonomy(row))

  const monthHoursValues: number[][] = []
  const monthCountValues: number[][] = []
  const monthBars = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const key = monthPrefix(year, monthIndex)
    const label = format(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), 'MMM')
    const hours: number[] = []
    const counts: number[] = []
    for (const seriesYear of years) {
      const prefix = monthPrefix(seriesYear, monthIndex)
      const logs = monthLogs.filter((row) => row.log_date.startsWith(prefix))
      hours.push(roundDisplayStat(logs.reduce((sum, row) => sum + secondsToHours(row.logged_seconds), 0)))
      counts.push(new Set(logs.map((row) => row.issue_id)).size)
    }
    monthHoursValues.push(hours)
    monthCountValues.push(counts)
    monthBars.push({ key, label })
  }

  const sortRoleKeys = (keys: string[]) =>
    keys.sort((a, b) => {
      if (a === TRAINING_MISSING_KEY) return 1
      if (b === TRAINING_MISSING_KEY) return -1
      return compareRoleKeysByDisplayOrder(a, b)
    })

  const roleSeries = new Map<
    string,
    { label: string; hoursByYear: Map<number, number>; issuesByYear: Map<number, Set<string>> }
  >()
  for (const row of roleWindowLogs) {
    const role = roleKeyForPerson(row.person_id, roleIdByPerson, roleById)
    const current = roleSeries.get(role.key) ?? {
      label: role.label,
      hoursByYear: new Map(years.map((seriesYear) => [seriesYear, 0])),
      issuesByYear: new Map(years.map((seriesYear) => [seriesYear, new Set<string>()])),
    }
    const seriesYear = logYear(row.log_date)
    current.hoursByYear.set(
      seriesYear,
      (current.hoursByYear.get(seriesYear) ?? 0) + secondsToHours(row.logged_seconds)
    )
    current.issuesByYear.get(seriesYear)?.add(row.issue_id)
    roleSeries.set(role.key, current)
  }
  const roleKeys = sortRoleKeys([...roleSeries.keys()])
  const roleHoursBars: TrainingYearGroupedBar[] = roleKeys.map((key) => {
    const bucket = roleSeries.get(key)!
    return {
      key,
      label: key === TRAINING_MISSING_KEY ? '—' : roleKeyAcronym(key),
      title: bucket.label,
      values: years.map((seriesYear) => roundDisplayStat(bucket.hoursByYear.get(seriesYear) ?? 0)),
    }
  })
  const roleCountBars: TrainingYearGroupedBar[] = roleKeys.map((key) => {
    const bucket = roleSeries.get(key)!
    return {
      key,
      label: key === TRAINING_MISSING_KEY ? '—' : roleKeyAcronym(key),
      title: bucket.label,
      values: years.map((seriesYear) => bucket.issuesByYear.get(seriesYear)?.size ?? 0),
    }
  })

  const kpiLogs = childLogs.filter(
    (row) => matchesRole(row) && inCompareWindow(row) && matchesTaxonomy(row)
  )
  const kpiFullLogs = childLogs.filter((row) => matchesRole(row) && matchesTaxonomy(row))
  const kpiByYear = new Map<number, { hours: number; issues: Set<string> }>()
  const kpiFullByYear = new Map<number, { hours: number; issues: Set<string> }>()
  for (const seriesYear of years) {
    kpiByYear.set(seriesYear, { hours: 0, issues: new Set() })
    kpiFullByYear.set(seriesYear, { hours: 0, issues: new Set() })
  }
  for (const row of kpiLogs) {
    const bucket = kpiByYear.get(logYear(row.log_date))
    if (!bucket) continue
    bucket.hours += secondsToHours(row.logged_seconds)
    bucket.issues.add(row.issue_id)
  }
  for (const row of kpiFullLogs) {
    const bucket = kpiFullByYear.get(logYear(row.log_date))
    if (!bucket) continue
    bucket.hours += secondsToHours(row.logged_seconds)
    bucket.issues.add(row.issue_id)
  }
  const currentHours = roundDisplayStat(kpiByYear.get(year)?.hours ?? 0)
  const currentTrainings = kpiByYear.get(year)?.issues.size ?? 0
  const kpiYears: TrainingYearCompareYear[] = years.map((seriesYear) => {
    const bucket = kpiByYear.get(seriesYear)!
    const full = kpiFullByYear.get(seriesYear)!
    const hours = roundDisplayStat(bucket.hours)
    const trainings = bucket.issues.size
    const yearDone = seriesYear < year
    return {
      year: seriesYear,
      hours,
      trainings,
      hoursFull: yearDone ? roundDisplayStat(full.hours) : null,
      trainingsFull: yearDone ? full.issues.size : null,
      hoursDeltaPct: seriesYear === year ? null : deltaPct(currentHours, hours),
      trainingsDeltaPct: seriesYear === year ? null : deltaPct(currentTrainings, trainings),
    }
  })

  const tableLogs = childLogs.filter((row) => inCompareWindow(row) && matchesTaxonomy(row))
  const tableRoles = new Map<string, { label: string; hoursByYear: Map<number, number> }>()
  for (const row of tableLogs) {
    const role = roleKeyForPerson(row.person_id, roleIdByPerson, roleById)
    const current = tableRoles.get(role.key) ?? {
      label: role.label,
      hoursByYear: new Map(years.map((seriesYear) => [seriesYear, 0])),
    }
    const seriesYear = logYear(row.log_date)
    current.hoursByYear.set(
      seriesYear,
      (current.hoursByYear.get(seriesYear) ?? 0) + secondsToHours(row.logged_seconds)
    )
    tableRoles.set(role.key, current)
  }
  const roleTableRows: TrainingYearRoleCompareRow[] = sortRoleKeys([...tableRoles.keys()]).map((key) => {
    const bucket = tableRoles.get(key)!
    return {
      key,
      label: key === TRAINING_MISSING_KEY ? '—' : roleKeyAcronym(key),
      title: bucket.label,
      hoursByYear: years.map((seriesYear) => roundDisplayStat(bucket.hoursByYear.get(seriesYear) ?? 0)),
    }
  })

  const priorYear = years.includes(year - 1) ? year - 1 : null
  const compareLabel = priorYear == null ? String(year) : `${year} vs ${priorYear}`
  const versionLogs = childLogs.filter(
    (row) => inCompareWindow(row) && matchesRole(row) && matchesComponent(row)
  )
  const areaLogs = childLogs.filter(
    (row) => inCompareWindow(row) && matchesRole(row) && matchesVersion(row)
  )

  return {
    year,
    years,
    kpis: {
      currentYear: year,
      throughLabel: windowLabel,
      years: kpiYears,
    },
    monthHours: {
      id: 'month-hours',
      title: 'Hours by month',
      description: 'Logged Tempo hours on training activities, every year with data.',
      paramKey: 'month',
      unit: 'hours',
      years,
      currentYear: year,
      bars: monthBars.map((bar, index) => ({ ...bar, values: monthHoursValues[index] })),
    },
    monthCounts: {
      id: 'month-counts',
      title: 'Trainings by month',
      description: 'Distinct activities with logged hours in each month, every year with data.',
      paramKey: 'month',
      unit: 'count',
      years,
      currentYear: year,
      bars: monthBars.map((bar, index) => ({ ...bar, values: monthCountValues[index] })),
    },
    roleCounts: {
      id: 'role-counts',
      title: 'Trainings by role',
      description: `Distinct activities by role · ${windowLabel}, every year with data.`,
      paramKey: 'role',
      unit: 'count',
      years,
      currentYear: year,
      bars: roleCountBars,
    },
    roleHours: {
      id: 'role-hours',
      title: 'Hours by role',
      description: `Logged Tempo hours by role · ${windowLabel}, every year with data.`,
      paramKey: 'role',
      unit: 'hours',
      years,
      currentYear: year,
      bars: roleHoursBars,
    },
    roleTable: {
      years,
      currentYear: year,
      throughLabel: windowLabel,
      rows: roleTableRows,
    },
    versions: {
      id: 'versions',
      title: 'Versions',
      description: `Fix versions · ${windowLabel}, ${compareLabel}. Click a row to scope areas.`,
      paramKey: 'version',
      currentYear: year,
      priorYear,
      rows: buildTaxonomyRows({
        logs: versionLogs,
        keysByIssue: versionsByIssue,
        currentYear: year,
        priorYear,
      }),
    },
    areas: {
      id: 'areas',
      title: 'Areas',
      description:
        filters.versionKey != null
          ? `Components in ${filters.versionKey} · ${windowLabel}, ${compareLabel}.`
          : `Top ${TAXONOMY_AREA_LIMIT} components · ${windowLabel}, ${compareLabel}.`,
      paramKey: 'component',
      currentYear: year,
      priorYear,
      rows: buildTaxonomyRows({
        logs: areaLogs,
        keysByIssue: componentsByIssue,
        currentYear: year,
        priorYear,
        limit: TAXONOMY_AREA_LIMIT,
      }),
    },
  }
}
