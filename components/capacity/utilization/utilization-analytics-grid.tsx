import type { ReactNode } from 'react'

import { HeadcountBarChart, type HeadcountBarChartRow } from '@/components/ui/headcount-bar-chart'
import { RoleAnalyticsTable } from '@/components/capacity/_shared/role-analytics-table'
import {
  DataSectionPanel,
  DataSectionPanelHeader,
  DataSectionPanelTotalBadge,
} from '@/components/ui/data-section-panel'
import { fmtHeadcountKpi } from '@/lib/overview/overview-metrics'
import type { RoleAnalyticsRow } from '@/lib/capacity/shared/load-role-analytics'

function toHeadcountBarRows(
  rows: RoleAnalyticsRow[],
  totalHeadcount: number
): HeadcountBarChartRow[] {
  return rows.map((row) => ({
    id: row.roleId ?? `hc-${row.roleKey}`,
    label: row.roleLabel,
    headcount: row.headcount,
    sharePct: totalHeadcount > 0 ? (row.headcount / totalHeadcount) * 100 : 0,
  }))
}

export function UtilizationAnalyticsGrid({
  rows,
  staffingSlot,
}: {
  rows: RoleAnalyticsRow[]
  staffingSlot?: ReactNode
}) {
  const headcountTotalInScope = rows.reduce((s, r) => s + r.headcount, 0)

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <DataSectionPanel
        className="min-h-72"
        dataSlot="team-analytics-utilization"
      >
        <DataSectionPanelHeader
          title="Utilization by role"
          description={
            <>
              Planning roster grouped by month role (from worklogs, set at month
              start). Pace and capacity-fill use the same MTD cap as overview.
              Sort and filter per column.
            </>
          }
        />
        <RoleAnalyticsTable rows={rows} wrapperClassName="mt-3" />
      </DataSectionPanel>

      <DataSectionPanel
        className="min-h-72"
        dataSlot="team-analytics-headcount"
      >
        <DataSectionPanelHeader
          title="Headcount by role"
          description={
            <>
              People with capacity rows for the month, grouped by month role
              (worklog stamp). Parentheses: share of{" "}
              <span className="text-foreground/80">Total</span>. Roster members
              with 0 logged still count in headcount.
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
        <HeadcountBarChart
          rows={toHeadcountBarRows(rows, headcountTotalInScope)}
          totalHeadcount={headcountTotalInScope}
          emptyMessage="No headcount in scope for this month."
          ariaLabel="Headcount by role as share of filtered people in scope"
        />
      </DataSectionPanel>

      {staffingSlot ? (
        <DataSectionPanel
          className="gap-3 lg:col-span-2"
          dataSlot="team-staffing-embed"
        >
          <DataSectionPanelHeader
            title="Staffing grid"
            description="Person-level capacity, plans, logged hours, utilization, and project mix for the filtered roster. Sort and filter per column."
          />
          {staffingSlot}
        </DataSectionPanel>
      ) : null}
    </div>
  );
}
