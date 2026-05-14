import type { TeamMonthKpisPayload } from "@/lib/team/load-team-month-kpis";
import { fmtHeadcountKpi, fmtHoursKpi, fmtPct } from "@/lib/overview/overview-metrics";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function KpiCard({
  title,
  value,
  footnote,
  className,
}: {
  title: string;
  value: ReactNode;
  footnote?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-36 shrink-0 grow basis-0 rounded-xl border border-border bg-card/30 p-3 ring-1 ring-foreground/5",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      {footnote ? (
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}

export function TeamKpiSection({ kpis }: { kpis: TeamMonthKpisPayload }) {
  const { rollupHours: r, asOfDate, headcountTotal } = kpis;
  const mtdNote = asOfDate
    ? `Non-PTO worklogs through ${asOfDate}`
    : "Overview worklog bound";
  const snapshotNote = "Snapshot facts for reference month";

  const items: {
    title: string;
    value: ReactNode;
    footnote: string;
  }[] = [
    {
      title: "Net capacity",
      value: fmtHoursKpi(r.netCapacityHours),
      footnote: snapshotNote,
    },
    {
      title: "Planned",
      value: fmtHoursKpi(r.plannedHours),
      footnote: snapshotNote,
    },
    {
      title: "Logged",
      value: fmtHoursKpi(r.loggedHoursMtd),
      footnote: mtdNote,
    },
    {
      title: "Billable",
      value: fmtHoursKpi(r.billableHoursMtd),
      footnote: mtdNote,
    },
    {
      title: "Utilization",
      value: fmtPct(kpis.utilizationOrgPct ?? null),
      footnote: "Org logged ÷ monthly net capacity (snapshot).",
    },
    {
      title: "Billable efficiency",
      value: fmtPct(kpis.billableEfficiencyPct ?? null),
      footnote:
        kpis.billableEfficiencyPct === null
          ? "— when logged hours are zero"
          : mtdNote,
    },
    {
      title: "Open capacity",
      value: fmtHoursKpi(r.availabilityHours),
      footnote: `${snapshotNote}`,
    },
    {
      title: "PTO impact",
      value: fmtHoursKpi(r.ptoHoursMonth),
      footnote: "PTO logs through calendar month end",
    },
    {
      title: "Headcount (total)",
      value: fmtHeadcountKpi(headcountTotal),
      footnote:
        "People with capacity rows for this month (same scope as filters).",
    },
  ];

  return (
    <section data-slot="team-kpis" aria-labelledby="team-kpis-heading">
      <h2
        id="team-kpis-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Current operations
      </h2>
      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
        {items.map((item) => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            footnote={item.footnote}
          />
        ))}
      </div>
    </section>
  );
}
