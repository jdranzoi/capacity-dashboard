import {
  HeadcountBarChart,
  type HeadcountBarChartRow,
} from "@/components/ui/headcount-bar-chart";
import {
  DataSectionPanel,
  DataSectionPanelHeader,
  DataSectionPanelTotalBadge,
} from "@/components/ui/data-section-panel";
import { fmtHeadcountKpi } from "@/lib/overview/overview-metrics";
import type { TeamsOverviewPayload } from "@/lib/teams/overview/load-teams-overview";

function toHeadcountBarRows(
  rows: TeamsOverviewPayload["byRole"],
): HeadcountBarChartRow[] {
  return rows.map((row) => ({
    id: row.id ?? row.key,
    label: row.label,
    headcount: row.headcount,
    sharePct: row.sharePct ?? 0,
  }));
}

export function TeamsOverviewDistributionSection({
  data,
}: {
  data: TeamsOverviewPayload;
}) {
  return (
    <section className="space-y-3" data-slot="teams-overview-distribution">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Structure
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <DataSectionPanel className="min-h-72">
          <DataSectionPanelHeader
            title="Role distribution"
            description="Roster grouped by stamped month role. Parentheses show share of total headcount."
            aside={
              <DataSectionPanelTotalBadge
                label="Total"
                value={fmtHeadcountKpi(data.headcount)}
                ariaLabel={`Total headcount: ${fmtHeadcountKpi(data.headcount)}`}
              />
            }
          />
          <HeadcountBarChart
            rows={toHeadcountBarRows(data.byRole)}
            totalHeadcount={data.headcount}
            emptyMessage="No roster members with a role assignment for this month."
            ariaLabel="Headcount by role as share of planning roster"
          />
        </DataSectionPanel>

        <DataSectionPanel className="min-h-72">
          <DataSectionPanelHeader
            title="Geographic distribution"
            description={
              <>
                Roster grouped by holiday zone from Zones. Zones drive PTO and
                holiday calendars.
              </>
            }
            aside={
              <DataSectionPanelTotalBadge
                label="Total"
                value={fmtHeadcountKpi(data.headcount)}
                ariaLabel={`Total headcount: ${fmtHeadcountKpi(data.headcount)}`}
              />
            }
          />
          <HeadcountBarChart
            rows={toHeadcountBarRows(data.byZone)}
            totalHeadcount={data.headcount}
            emptyMessage="No roster members with a zone assignment."
            ariaLabel="Headcount by holiday zone as share of planning roster"
          />
        </DataSectionPanel>
      </div>
    </section>
  );
}
