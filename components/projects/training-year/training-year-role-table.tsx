'use client'

import { useTrainingYearSelection } from '@/components/projects/training-year/use-training-year-selection'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import type { TrainingYearRoleTable } from '@/lib/projects/training-year/training-year-types'
import { dashboardTableShellClass } from '@/lib/ui/dashboard-surface'
import { cn } from '@/lib/utils'

export function TrainingYearRoleTable({
  table,
  selectedRoleKey,
}: {
  table: TrainingYearRoleTable
  selectedRoleKey: string | null
}) {
  const setSelection = useTrainingYearSelection()
  const totals = table.years.map((_, yearIndex) =>
    table.rows.reduce((sum, row) => sum + (row.hoursByYear[yearIndex] ?? 0), 0)
  )

  return (
    <div
      className={cn(dashboardTableShellClass(), 'flex h-full min-h-0 flex-col p-3')}
      data-slot="training-year-role-table"
    >
      <p className="shrink-0 text-sm font-medium tracking-tight">Hours by role</p>
      <p className="mt-0.5 shrink-0 text-[0.7rem] text-muted-foreground">
        Same months · {table.throughLabel}. Click a role to slice.
      </p>
      {table.rows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No role hours in this window.</p>
      ) : (
        <div className="mt-2 min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  Role
                </th>
                {table.years.map((year) => (
                  <th
                    key={year}
                    className={cn(
                      'px-2 py-1.5 text-right text-xs font-medium tabular-nums text-muted-foreground',
                      year === table.currentYear && 'text-foreground'
                    )}
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => {
                const selected = selectedRoleKey === row.key
                return (
                  <tr
                    key={row.key}
                    className={cn(
                      'cursor-pointer border-b border-border/45',
                      selected ? 'bg-muted/50' : 'hover:bg-muted/30'
                    )}
                    onClick={() => setSelection('role', row.key, selectedRoleKey)}
                  >
                    <th
                      scope="row"
                      className={cn(
                        'px-2 py-1.5 text-left text-xs font-medium',
                        selected && 'text-foreground'
                      )}
                      title={row.title}
                    >
                      {row.label}
                    </th>
                    {row.hoursByYear.map((hours, index) => {
                      const year = table.years[index]
                      return (
                        <td
                          key={year}
                          className={cn(
                            'px-2 py-1.5 text-right text-xs tabular-nums text-muted-foreground',
                            year === table.currentYear && 'font-medium text-foreground'
                          )}
                        >
                          {fmtHoursKpi(hours)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <th
                  scope="row"
                  className="px-2 py-1.5 text-left text-xs font-medium text-foreground"
                >
                  Total
                </th>
                {totals.map((hours, index) => {
                  const year = table.years[index]
                  return (
                    <td
                      key={year}
                      className={cn(
                        'px-2 py-1.5 text-right text-xs font-semibold tabular-nums text-muted-foreground',
                        year === table.currentYear && 'text-foreground'
                      )}
                    >
                      {fmtHoursKpi(hours)}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
