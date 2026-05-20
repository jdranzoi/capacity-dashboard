import type { ReactNode } from 'react'

import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from '@/lib/overview/overview-metrics'
import type { TeamRoleAnalyticsRow } from '@/lib/team/load-team-role-analytics'
import { utilizationLoggedVsCapacityBarStyles, utilizationLoggedVsCapacityCellStyle } from '@/lib/team/team-utilization-tone'

const SEGMENT_OPACITIES = [0.22, 0.34, 0.46, 0.58, 0.7] as const

function segmentStyle(i: number): { opacity: number } {
  return { opacity: SEGMENT_OPACITIES[i % SEGMENT_OPACITIES.length] }
}

function roundPct(n: number): number {
  return Math.round(n)
}

function UtilizationByRoleTable({ rows }: { rows: TeamRoleAnalyticsRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        No capacity rows in scope for this month.
      </p>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="py-2 pr-3">
              Role
            </th>
            <th scope="col" className="py-2 pr-3 text-right tabular-nums">
              Net cap
            </th>
            <th scope="col" className="py-2 pr-3 text-right tabular-nums">
              Planned
            </th>
            <th scope="col" className="py-2 pr-3 text-right tabular-nums">
              Logged
            </th>
            <th
              scope="col"
              className="py-2 pr-3 text-right tabular-nums"
              title="Mean per-person pace: logged MTD / (elapsed net weekdays × 8h)"
            >
              Util
            </th>
            <th scope="col" className="py-2 pl-2">
              <span className="sr-only">Utilization bar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.roleId ?? `unassigned-${r.roleKey}`}
              className="border-b border-border/60 last:border-b-0"
            >
              <td className="py-2 pr-3 font-medium text-foreground">{r.roleLabel}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtHoursKpi(r.netCapacityHours)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtHoursKpi(r.plannedHours)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtHoursKpi(r.loggedHoursMtd)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                <span
                  className="inline-block min-w-14 rounded-md px-2 py-0.5 ring-1 ring-foreground/8"
                  style={utilizationLoggedVsCapacityCellStyle(r.utilizationPct)}
                >
                  {fmtPct(r.utilizationPct)}
                </span>
              </td>
              <td className="py-2 pl-2">
                <div
                  className="h-2 w-full min-w-16 rounded-full bg-muted/50"
                  title={
                    [r.utilizationPct != null ? `${r.utilizationPct}% pace (mean per person)` : null,
                      r.utilizationCapacityFillPct != null
                        ? `${r.utilizationCapacityFillPct}% capacity fill`
                        : null]
                      .filter(Boolean)
                      .join('. ') || undefined
                  }
                >
                  <div
                    className="h-2 min-w-0 rounded-full"
                    style={utilizationLoggedVsCapacityBarStyles(r.utilizationPct)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CapacityShareBar({ rows }: { rows: TeamRoleAnalyticsRow[] }) {
  const total = rows.reduce((s, r) => s + r.netCapacityHours, 0)
  if (total <= 0) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">No net capacity in scope to chart.</p>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div
        className="flex h-8 w-full overflow-hidden rounded-lg ring-1 ring-foreground/10"
        role="img"
        aria-label="Net capacity share by role"
      >
        {rows.map((r, i) => {
          const pct = (r.netCapacityHours / total) * 100
          if (pct <= 0) return null
          return (
            <div
              key={r.roleId ?? `seg-${r.roleKey}`}
              title={`${r.roleLabel}: ${fmtHoursKpi(r.netCapacityHours)} (${roundPct(pct)}%)`}
              className="h-full min-w-px bg-foreground"
              style={{ ...segmentStyle(i), width: `${pct}%` }}
            />
          )
        })}
      </div>
      <ul className="grid gap-1.5 text-[10px] text-muted-foreground sm:grid-cols-2">
        {rows.map((r, i) => {
          const pct = total > 0 ? (r.netCapacityHours / total) * 100 : 0
          return (
            <li key={r.roleId ?? `leg-${r.roleKey}`} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm bg-foreground"
                style={segmentStyle(i)}
              />
              <span className="min-w-0 truncate">
                {r.roleLabel} — {fmtHoursKpi(r.netCapacityHours)} ({roundPct(pct)}%)
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
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
  /** Full-width staffing table between utilization/headcount row and capacity distribution. */
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
          capacity-fill use the same MTD cap as overview.{' '}
          <span className="text-foreground/80">Headcount by role</span> sits beside this card.
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
      <div
        className="flex min-h-72 flex-col rounded-xl border border-border bg-card/20 p-4 ring-1 ring-foreground/5 lg:col-span-2"
        data-slot="team-analytics-d3"
      >
        <p className="text-sm font-medium text-foreground">Capacity distribution</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share of net capacity hours by role (snapshot month).
        </p>
        <CapacityShareBar rows={rows} />
      </div>
      <div
        className="flex min-h-48 flex-col rounded-xl border border-border bg-card/20 p-4 ring-1 ring-foreground/5 lg:col-span-2"
        data-slot="team-analytics-d4-placeholder"
      >
        <p className="text-sm font-medium text-foreground">Skills metrics</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Phase 6 on hold pending historical tracking semantics and schema decisions — no skills dimension on{' '}
          <span className="font-mono text-[11px]">dim_person</span> today.
        </p>
      </div>
    </div>
  )
}
