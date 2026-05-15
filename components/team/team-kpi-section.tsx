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
  const { rollupHours: r, asOfDate, headcountTotal, projectScopedHours: scoped } =
    kpis;
  const mtdNote = asOfDate
    ? `Non-PTO worklogs through ${asOfDate}`
    : "Overview worklog bound";
  const snapshotNote = "Snapshot facts for reference month";
  const plannedHours = scoped?.plannedHours ?? r.plannedHours;
  const loggedHours = scoped?.loggedHoursMtd ?? r.loggedHoursMtd;
  const billableHours = scoped?.billableHoursMtd ?? r.billableHoursMtd;
  const plannedFootnote = scoped
    ? `${snapshotNote} Selected project only (non-PTO plans).`
    : snapshotNote;
  const logBillFootnote = scoped
    ? `${mtdNote} Selected project only.`
    : mtdNote;
  const utilizationFootnote = scoped
    ? "Logged on selected project ÷ monthly net capacity (filtered people)."
    : "Org logged ÷ monthly net capacity (snapshot).";
  const efficiencyFootnote =
    kpis.billableEfficiencyPct === null
      ? "— when logged hours are zero"
      : scoped
        ? `${mtdNote} Selected project only.`
        : mtdNote;

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
      value: fmtHoursKpi(plannedHours),
      footnote: plannedFootnote,
    },
    {
      title: "Logged",
      value: fmtHoursKpi(loggedHours),
      footnote: logBillFootnote,
    },
    {
      title: "Billable",
      value: fmtHoursKpi(billableHours),
      footnote: logBillFootnote,
    },
    {
      title: "Utilization",
      value: fmtPct(kpis.utilizationOrgPct ?? null),
      footnote: utilizationFootnote,
    },
    {
      title: "Billable efficiency",
      value: fmtPct(kpis.billableEfficiencyPct ?? null),
      footnote: efficiencyFootnote,
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
      footnote: `${snapshotNote}`,
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
