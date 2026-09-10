import { addMonths, format, parse, startOfMonth } from 'date-fns'

import { roundDisplayStat } from '@/lib/format/display-stats'
import { jiraIssueBrowseUrl } from '@/lib/projects/training/jira-browse-url'
import { TRAINING_MISSING_KEY, TRAINING_MISSING_LABEL } from '@/lib/projects/training/training-constants'
import type { TrainingIssueFact, TrainingWorklogFact } from '@/lib/projects/training/load-training-facts'
import {
  hoursVersusEstimatePct,
  momLoggedDeltaPct,
  secondsToHours,
} from '@/lib/projects/training/training-metrics'
import { isMissingTaxonomyKey, type TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'
import type {
  TrainingActivityRow,
  TrainingDashboardPayload,
  TrainingStatusBucket,
  TrainingTaxonomyRow,
} from '@/lib/projects/training/training-types'

/** Values the roll-ups and the missing-fields filter need, but the UI never renders. */
type TrainingActivityDraft = TrainingActivityRow & {
  loggedHoursLifetime: number
  missingEstimate: boolean
  missingVersion: boolean
  missingComponent: boolean
}

function statusBucket(category: string | null): TrainingStatusBucket {
  if (category === 'done') return 'done'
  if (category === 'indeterminate') return 'in_progress'
  if (category === 'new' || category === 'undefined') return 'todo'
  return 'other'
}

function explodeKeys(values: string[]): string[] {
  return values.length > 0 ? values : [TRAINING_MISSING_KEY]
}

function matchesTaxonomy(
  values: string[],
  selected: string | null
): boolean {
  if (!selected) return true
  if (isMissingTaxonomyKey(selected)) return values.length === 0
  return values.includes(selected)
}

function rollupTaxonomy(
  activities: TrainingActivityRow[],
  pick: (row: TrainingActivityRow) => string[]
): TrainingTaxonomyRow[] {
  const buckets = new Map<
    string,
    {
      label: string
      isMissing: boolean
      rows: TrainingActivityRow[]
    }
  >()

  for (const activity of activities) {
    for (const key of explodeKeys(pick(activity))) {
      const isMissing = key === TRAINING_MISSING_KEY
      const current = buckets.get(key) ?? {
        label: isMissing ? TRAINING_MISSING_LABEL : key,
        isMissing,
        rows: [],
      }
      current.rows.push(activity)
      buckets.set(key, current)
    }
  }

  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const loggedHoursMonth = bucket.rows.reduce((sum, row) => sum + row.loggedHoursMonth, 0)
      return {
        key,
        label: bucket.label,
        isMissing: bucket.isMissing,
        activityCount: bucket.rows.length,
        todoCount: bucket.rows.filter((row) => row.statusBucket === 'todo').length,
        inProgressCount: bucket.rows.filter((row) => row.statusBucket === 'in_progress').length,
        doneCount: bucket.rows.filter((row) => row.statusBucket === 'done').length,
        loggedHoursMonth: roundDisplayStat(loggedHoursMonth),
      }
    })
    .sort((a, b) => {
      if (a.isMissing !== b.isMissing) return a.isMissing ? 1 : -1
      return a.label.localeCompare(b.label)
    })
}

function sumSeconds(
  worklogs: TrainingWorklogFact[],
  issueId: string,
  predicate: (logDate: string) => boolean
): number {
  let seconds = 0
  for (const worklog of worklogs) {
    if (worklog.issue_id !== issueId) continue
    if (!predicate(worklog.log_date)) continue
    seconds += worklog.logged_seconds
  }
  return seconds
}

export function buildTrainingDashboard(params: {
  issues: TrainingIssueFact[]
  worklogs: TrainingWorklogFact[]
  personNameById: Map<string, string>
  filters: TrainingRouteFilters
  monthKey: string
}): TrainingDashboardPayload {
  const monthStart = startOfMonth(parse(`${params.monthKey}-01`, 'yyyy-MM-dd', new Date()))
  const monthStartStr = format(monthStart, 'yyyy-MM-dd')
  const monthEndStr = format(addMonths(monthStart, 1), 'yyyy-MM-dd')
  const lastMonthStart = addMonths(monthStart, -1)
  const lastMonthStartStr = format(lastMonthStart, 'yyyy-MM-dd')
  const lastMonthEndStr = monthStartStr

  const inMonth = (logDate: string) => logDate >= monthStartStr && logDate < monthEndStr
  const inLastMonth = (logDate: string) =>
    logDate >= lastMonthStartStr && logDate < lastMonthEndStr

  const personQuery = params.filters.personQuery?.toLowerCase() ?? null

  const activities: TrainingActivityDraft[] = params.issues
    .filter((issue) => issue.is_child)
    .map((issue) => {
      const estimateHours =
        issue.original_estimate_seconds == null
          ? null
          : secondsToHours(issue.original_estimate_seconds)
      const loggedHoursLifetime = secondsToHours(sumSeconds(params.worklogs, issue.id, () => true))
      const loggedHoursMonth = secondsToHours(sumSeconds(params.worklogs, issue.id, inMonth))
      return {
        id: issue.id,
        issueKey: issue.issue_key,
        jiraUrl: jiraIssueBrowseUrl(issue.issue_key),
        summary: issue.summary,
        status: issue.status,
        statusBucket: statusBucket(issue.status_category),
        personName: issue.assignee_person_id
          ? params.personNameById.get(issue.assignee_person_id) ?? null
          : null,
        fixVersions: issue.fix_versions ?? [],
        components: issue.components ?? [],
        labels: issue.labels ?? [],
        estimateHours,
        loggedHoursLifetime,
        loggedHoursMonth,
        fillPct: hoursVersusEstimatePct(loggedHoursLifetime, estimateHours),
        missingEstimate: estimateHours == null,
        missingVersion: (issue.fix_versions ?? []).length === 0,
        missingComponent: (issue.components ?? []).length === 0,
      }
    })
    .filter((row) => {
      if (personQuery && !(row.personName ?? '').toLowerCase().includes(personQuery)) {
        return false
      }
      if (params.filters.missingOnly && !row.missingEstimate && !row.missingVersion && !row.missingComponent) {
        return false
      }
      return true
    })

  const versionScoped = activities.filter((row) =>
    matchesTaxonomy(row.fixVersions, params.filters.versionKey)
  )
  const componentScoped = versionScoped.filter((row) =>
    matchesTaxonomy(row.components, params.filters.componentKey)
  )
  const topicScoped = componentScoped.filter((row) =>
    matchesTaxonomy(row.labels, params.filters.topicKey)
  )

  const loggedHoursMonth = topicScoped.reduce((sum, row) => sum + row.loggedHoursMonth, 0)
  const loggedHoursLastMonth = topicScoped.reduce(
    (sum, row) =>
      sum + secondsToHours(sumSeconds(params.worklogs, row.id, inLastMonth)),
    0
  )
  const estimateHours = topicScoped.reduce((sum, row) => sum + (row.estimateHours ?? 0), 0)
  const estimatedActivityCount = topicScoped.filter((row) => row.estimateHours != null).length
  const loggedHoursLifetime = topicScoped.reduce((sum, row) => sum + row.loggedHoursLifetime, 0)

  return {
    monthKey: params.monthKey,
    kpis: {
      activityCount: topicScoped.length,
      todoCount: topicScoped.filter((row) => row.statusBucket === 'todo').length,
      inProgressCount: topicScoped.filter((row) => row.statusBucket === 'in_progress').length,
      doneCount: topicScoped.filter((row) => row.statusBucket === 'done').length,
      loggedHoursMonth: roundDisplayStat(loggedHoursMonth),
      momDeltaHours: roundDisplayStat(loggedHoursMonth - loggedHoursLastMonth),
      momDeltaPct: momLoggedDeltaPct(loggedHoursMonth, loggedHoursLastMonth),
      fillPct: hoursVersusEstimatePct(
        loggedHoursLifetime,
        estimatedActivityCount > 0 ? estimateHours : null
      ),
      estimatedActivityCount,
      missingEstimateCount: topicScoped.filter((row) => row.missingEstimate).length,
    },
    versions: rollupTaxonomy(activities, (row) => row.fixVersions),
    components: rollupTaxonomy(versionScoped, (row) => row.components),
    labels: rollupTaxonomy(componentScoped, (row) => row.labels),
    activities: topicScoped.map((row) => ({
      id: row.id,
      issueKey: row.issueKey,
      jiraUrl: row.jiraUrl,
      summary: row.summary,
      status: row.status,
      statusBucket: row.statusBucket,
      personName: row.personName,
      fixVersions: row.fixVersions,
      components: row.components,
      labels: row.labels,
      estimateHours: row.estimateHours == null ? null : roundDisplayStat(row.estimateHours),
      loggedHoursMonth: roundDisplayStat(row.loggedHoursMonth),
      fillPct: row.fillPct == null ? null : roundDisplayStat(row.fillPct),
    })),
  }
}
