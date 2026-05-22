import type { ReactNode } from 'react'

import { RoleAnalyticsTable } from '@/components/capacity/_shared/role-analytics-table'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
  DataSectionPanelTotalBadge,
} from '@/components/ui/data-section-panel'
import { fmtHeadcountKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'

function headcountAxisDomainMax(maxHc: number): number {
  if (maxHc <= 0) return 5
  return Math.max(5, Math.ceil(maxHc / 5) * 5)
}

function HeadcountByRoleHorizontalChart({
  rows,
  totalHeadcount,
}: {
  rows: RoleAnalyticsRow[]
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

export function UtilizationAnalyticsGrid({
  rows,
  staffingSlot,
}: {
  rows: RoleAnalyticsRow[]
  /** Full-width staffing grid below utilization and headcount cards. */
  staffingSlot?: ReactNode
}) {
  const headcountTotalInScope = rows.reduce((s, r) => s + r.headcount, 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DataSectionPanel className="min-h-72" dataSlot="team-analytics-utilization">
        <DataSectionPanelHeader
          title="Utilization by role"
          description={
            <>
              Planning roster grouped by month role (from worklogs, set at month start). Pace and
              capacity-fill use the same MTD cap as overview. Sort and filter per column.
            </>
          }
        />
        <RoleAnalyticsTable rows={rows} wrapperClassName="mt-3" />
      </DataSectionPanel>

      <DataSectionPanel className="min-h-72" dataSlot="team-analytics-headcount">
        <DataSectionPanelHeader
          title="Headcount by role"
          description={
            <>
              People with capacity rows for the month, grouped by month role (worklog stamp).
              Parentheses: share of <span className="text-foreground/80">Total</span>. Roster
              members with 0 logged still count in headcount.
            </>
          }
          aside={
            <DataSectionPanelTotalBadge
              label="Total"
              value={fmtHeadcountKpi(headcountTotalInScope)}
              ariaLabel={`Total headcount in scope: ${fmtHeadcountKpi(headcountTotalInScope)}`}
            />
          }
        />
        <HeadcountByRoleHorizontalChart rows={rows} totalHeadcount={headcountTotalInScope} />
      </DataSectionPanel>

      {staffingSlot ? (
        <DataSectionPanel className="gap-3 lg:col-span-2" dataSlot="team-staffing-embed">
          <DataSectionPanelHeader
            title="Staffing grid"
            description="Person-level capacity, plans, logged hours, utilization, and project mix for the filtered roster. Sort and filter per column."
          />
          {staffingSlot}
        </DataSectionPanel>
      ) : null}
    </div>
  )
}
