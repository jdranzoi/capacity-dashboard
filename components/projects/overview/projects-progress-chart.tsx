'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import {
  PlannedLoggedBarLegend,
  PlannedLoggedProgressBar,
} from '@/components/projects/overview/planned-logged-progress-bar'
import { projectCardTitle, projectSortLabel } from '@/lib/teams/composition/teams-composition-utils'
import { fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { ProjectOverviewRow } from '@/lib/projects/overview/projects-types'
import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/lib/ui/dashboard-surface'

type SortColumn = 'project' | 'planned' | 'logged' | 'budgetUsed'
type SortDir = 'asc' | 'desc'

function SortHeaderButton({
  label,
  active,
  direction,
  align = 'left',
  onClick,
}: {
  label: string
  active: boolean
  direction: SortDir | null
  align?: 'left' | 'right'
  onClick: () => void
}) {
  const Icon =
    direction === 'desc' ? ArrowDown : direction === 'asc' ? ArrowUp : ArrowUpDown

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
        align === 'right' && 'ms-auto w-full justify-end'
      )}
    >
      <span className="truncate">{label}</span>
      <Icon
        className={cn('size-3 shrink-0 opacity-40', active && 'opacity-90')}
        aria-hidden
      />
    </button>
  )
}

export function ProjectsProgressChart({
  rows,
  selectedProjectKey,
  onSelectProject,
  chartTitle,
  headerAction,
}: {
  rows: ProjectOverviewRow[]
  selectedProjectKey: string | null
  onSelectProject: (projectKey: string) => void
  chartTitle: string
  headerAction?: ReactNode
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('budgetUsed')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDir(column === 'project' ? 'asc' : 'desc')
    }
  }

  const sortedRows = useMemo(() => {
    const copy = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1

    copy.sort((a, b) => {
      if (sortColumn === 'project') {
        return (
          dir *
          projectSortLabel(a).localeCompare(projectSortLabel(b), 'en', {
            sensitivity: 'base',
          })
        )
      }
      if (sortColumn === 'planned') return dir * (a.plannedHours - b.plannedHours)
      if (sortColumn === 'logged') return dir * (a.loggedHours - b.loggedHours)
      const aPct = a.budgetUsedPct ?? -1
      const bPct = b.budgetUsedPct ?? -1
      return dir * (aPct - bPct)
    })
    return copy
  }, [rows, sortColumn, sortDir])

  const sortDirectionFor = (column: SortColumn): SortDir | null =>
    sortColumn === column ? sortDir : null

  return (
    <div className={cn(dashboardSurfaceClass('flex flex-col p-4'))}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{chartTitle}</h2>
          <PlannedLoggedBarLegend className="mt-0.5" />
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <colgroup>
            <col className="w-[min(28%,14rem)]" />
            <col className="w-[36%]" />
            <col className="w-[4.5rem]" />
            <col className="w-[4.5rem]" />
            <col className="w-[4.5rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">
                <SortHeaderButton
                  label="Project"
                  active={sortColumn === 'project'}
                  direction={sortDirectionFor('project')}
                  onClick={() => toggleSort('project')}
                />
              </th>
              <th className="pb-2 pr-2 font-medium">
                <span className="text-[10px] font-medium uppercase tracking-wide">
                  Progress
                </span>
              </th>
              <th className="pb-2 pr-2 text-right font-medium">
                <SortHeaderButton
                  label="Planned (h)"
                  active={sortColumn === 'planned'}
                  direction={sortDirectionFor('planned')}
                  align="right"
                  onClick={() => toggleSort('planned')}
                />
              </th>
              <th className="pb-2 pr-2 text-right font-medium">
                <SortHeaderButton
                  label="Logged (h)"
                  active={sortColumn === 'logged'}
                  direction={sortDirectionFor('logged')}
                  align="right"
                  onClick={() => toggleSort('logged')}
                />
              </th>
              <th className="pb-2 text-right font-medium">
                <SortHeaderButton
                  label="Budget used"
                  active={sortColumn === 'budgetUsed'}
                  direction={sortDirectionFor('budgetUsed')}
                  align="right"
                  onClick={() => toggleSort('budgetUsed')}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const title = projectCardTitle({
                projectKey: row.projectKey,
                projectName: row.projectName,
              })
              const isSelected = selectedProjectKey === row.projectKey

              return (
                <tr
                  key={row.projectId}
                  className={cn(
                    'border-b border-border/60 transition-colors',
                    isSelected ? 'bg-muted/40' : 'hover:bg-muted/25'
                  )}
                >
                  <td className="py-2.5 pr-2">
                    <button
                      type="button"
                      onClick={() => onSelectProject(row.projectKey)}
                      className="block w-full truncate text-left font-medium text-foreground hover:underline"
                      title={title}
                    >
                      {title}
                    </button>
                  </td>
                  <td className="py-2.5 pr-2">
                    <PlannedLoggedProgressBar
                      plannedHours={row.plannedHours}
                      loggedHours={row.loggedHours}
                      overrunHours={row.overrunHours}
                      trackClassName="h-2.5"
                    />
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {fmtHoursKpi(row.plannedHours)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-foreground">
                    {fmtHoursKpi(row.loggedHours)}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 text-right tabular-nums font-medium',
                      row.atRisk ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {row.budgetUsedPct != null ? fmtPct(row.budgetUsedPct) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sortedRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No projects match the current filters.
        </p>
      ) : null}
    </div>
  )
}
