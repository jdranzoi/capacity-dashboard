import type { ReactNode } from 'react'

import { TeamUtilizationByRoleTable } from '@/components/team/team-utilization-by-role-table'
import { fmtHeadcountKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'

function UtilizationByRoleTable({ rows }: { rows: TeamRoleAnalyticsRow[] }) {
  return <TeamUtilizationByRoleTable rows={rows} />
}

function headcountAxisDomainMax(maxHc: number): number {
  if (maxHc <= 0) return 5
  return Math.max(5, Math.ceil(maxHc / 5) * 5)
}

function HeadcountByRoleHorizontalChart({
  rows,
  totalHeadcount,
}: {
  rows: TeamRoleAnalyticsRow[]
  /** Sum of row headcounts; same denominator for share % (respects `/team` filters). */
  totalHeadcount: number
}) {
  const chartRows = [...rows]
    .filter((r) => r.headcount > 0)
    .sort((a, b) => a.roleLabel.localeCompare(b.roleLabel, 'en', { sensitivity: 'base' }))

  if (chartRows.length === 0) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">No headcount in scope for this month.</p>
    )
  }

  const maxHc = chartRows.reduce((m, r) => Math.max(m, r.headcount), 0)
  const domainMax = headcountAxisDomainMax(maxHc)
  const tickStep = 5
  const ticks = Array.from({ length: domainMax / tickStep + 1 }, (_, i) => i * tickStep)

  return (
    <div className="mt-4">
      <ul
        className="list-none space-y-2.5 p-0"
        aria-label="Headcount by role as share of filtered people in scope"
      >
        {chartRows.map((r) => {
          const widthPct = domainMax > 0 ? Math.min(100, (r.headcount / domainMax) * 100) : 0
          const label = fmtHeadcountKpi(r.headcount)
          const sharePctRaw = totalHeadcount > 0 ? (r.headcount / totalHeadcount) * 100 : 0
          const sharePctLabel = fmtPct(sharePctRaw)
          const fullLabel = `${r.roleLabel}, ${fmtHeadcountKpi(r.headcount)} (${sharePctLabel} of ${fmtHeadcountKpi(totalHeadcount)})`
          return (
            <li
              key={r.roleId ?? `hc-${r.roleKey}`}
              className="grid gap-x-3"
              style={{ gridTemplateColumns: 'minmax(11rem, 34%) minmax(0, 1fr)' }}
            >
              <div
                className="min-w-0 truncate text-sm leading-6 text-foreground"
                title={fullLabel}
              >
                <span className="font-medium">{r.roleLabel}</span>
                <span className="whitespace-nowrap font-normal tabular-nums text-muted-foreground">
                  {' '}
                  ({sharePctLabel})
                </span>
              </div>
              <div className="min-w-0">
                <div className="relative h-6 w-full overflow-hidden rounded-sm bg-muted/40 ring-1 ring-foreground/6">
                  <div
                    className="flex h-full min-w-6.5 items-center justify-end rounded-sm bg-team-headcount-bar pr-1.5"
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-[11px] font-medium tabular-nums text-team-headcount-bar-label">
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <div
        className="mt-2 grid gap-x-3"
        style={{ gridTemplateColumns: 'minmax(11rem, 34%) minmax(0, 1fr)' }}
      >
        <div aria-hidden />
        <div className="flex justify-between border-t border-border/60 pt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          {ticks.map((t) => (
            <span key={t}>{fmtHeadcountKpi(t)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TeamAnalyticsGrid({
  rows,
  staffingSlot,
}: {
  rows: TeamRoleAnalyticsRow[]
  /** Full-width staffing grid below utilization and headcount cards. */
  staffingSlot?: ReactNode
}) {
  const headcountTotalInScope = rows.reduce((s, r) => s + r.headcount, 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div
        className="flex min-h-72 flex-col rounded-xl border border-border bg-card/20 p-4 ring-1 ring-foreground/5"
        data-slot="team-analytics-d1"
      >
        <p className="text-sm font-medium text-foreground">Utilization by role</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Planning roster grouped by month role (from worklogs, set at month start). Pace and
          capacity-fill use the same MTD cap as overview. Sort and filter per column.
        </p>
        <UtilizationByRoleTable rows={rows} />
      </div>
      <div
        className="flex min-h-72 flex-col rounded-xl border border-border bg-card/20 p-4 ring-1 ring-foreground/5"
        data-slot="team-analytics-d2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Headcount by role</p>
            <p className="mt-1 text-xs text-muted-foreground">
              People with capacity rows for the month, grouped by month role (worklog stamp).
              Parentheses: share of <span className="text-foreground/80">Total</span>. Roster
              members with 0 logged still count in headcount.
            </p>
          </div>
          <output
            className="shrink-0 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-right ring-1 ring-foreground/4"
            aria-label={`Total headcount in scope: ${fmtHeadcountKpi(headcountTotalInScope)}`}
          >
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="font-mono text-xl font-semibold tabular-nums leading-tight tracking-tight text-foreground">
              {fmtHeadcountKpi(headcountTotalInScope)}
            </span>
          </output>
        </div>
        <HeadcountByRoleHorizontalChart rows={rows} totalHeadcount={headcountTotalInScope} />
      </div>
      {staffingSlot ? (
        <div
          className="flex flex-col gap-3 lg:col-span-2"
          data-slot="team-staffing-embed"
          aria-labelledby="team-staffing-subheading"
        >
          <h3
            id="team-staffing-subheading"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Staffing grid
          </h3>
          {staffingSlot}
        </div>
      ) : null}
    </div>
  )
}
