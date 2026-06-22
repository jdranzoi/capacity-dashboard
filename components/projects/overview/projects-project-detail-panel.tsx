"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format, parse } from "date-fns";
import { Link2, CircleHelp } from "lucide-react";

import { ProjectExecutionChart } from "@/components/projects/overview/project-execution-chart";
import {
  mergeRoleHoursForChart,
  ProjectRoleGroupedChart,
} from "@/components/projects/overview/project-role-grouped-chart";
import { ProjectVelocityChart } from "@/components/projects/overview/project-velocity-chart";
import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from "@/components/ui/data-section-panel";
import { fmtHoursKpi, fmtPct, fmtPlanVarianceKpi } from "@/lib/overview/overview-metrics";
import { PROJECT_DETAIL_KPI_TOOLTIPS } from "@/components/projects/overview/projects-detail-kpi-tooltips";
import {
  buildProjectDetailKpiContextLines,
  type ProjectDetailKpiContextLine,
} from "@/lib/projects/overview/project-detail-kpi-context";
import type { ProjectDetailPanelPayload } from "@/lib/projects/overview/projects-types";
import { projectSpaceTypeLabel } from "@/lib/domain/project-types";
import { projectCardTitle } from "@/lib/teams/composition/teams-composition-utils";
import { cn } from "@/lib/utils";
import { dashboardSurfaceClass } from "@/lib/ui/dashboard-surface";

function formatStartDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(parse(iso, "yyyy-MM-dd", new Date()), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

const DETAIL_META_TAG_CLASS = {
  type: "bg-[color-mix(in_oklch,var(--overview-metric-planned)_14%,transparent)] text-[var(--overview-metric-planned)] dark:bg-[color-mix(in_oklch,var(--overview-metric-planned)_24%,transparent)]",
  pm: "bg-[color-mix(in_oklch,var(--overview-metric-net)_14%,transparent)] text-[var(--overview-metric-net)] dark:bg-[color-mix(in_oklch,var(--overview-metric-net)_24%,transparent)]",
  tl: "bg-[color-mix(in_oklch,var(--overview-metric-billable)_14%,transparent)] text-[var(--overview-metric-billable)] dark:bg-[color-mix(in_oklch,var(--overview-metric-billable)_24%,transparent)]",
  release:
    "bg-[color-mix(in_oklch,var(--overview-metric-availability)_14%,transparent)] text-[var(--overview-metric-availability)] dark:bg-[color-mix(in_oklch,var(--overview-metric-availability)_24%,transparent)]",
  started:
    "bg-[color-mix(in_oklch,var(--overview-metric-pto)_14%,transparent)] text-[var(--overview-metric-pto)] dark:bg-[color-mix(in_oklch,var(--overview-metric-pto)_24%,transparent)]",
} as const;

function DetailMetaTag({
  tone,
  children,
}: {
  tone: keyof typeof DETAIL_META_TAG_CLASS;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[0.65rem] font-medium leading-none",
        DETAIL_META_TAG_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

function ProjectDetailMetaRow({ detail }: { detail: ProjectDetailPanelPayload }) {
  const started = formatStartDate(detail.startDate);
  const releaseFormatted = detail.targetReleaseDate
    ? formatStartDate(detail.targetReleaseDate)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DetailMetaTag tone="type">{projectSpaceTypeLabel(detail.projectType)}</DetailMetaTag>
      <DetailMetaTag tone="pm">PM: {detail.pmName ?? "—"}</DetailMetaTag>
      <DetailMetaTag tone="tl">TL: {detail.tlNames ?? "—"}</DetailMetaTag>
      {started ? (
        <DetailMetaTag tone="started">Kick off: {started}</DetailMetaTag>
      ) : null}
      {releaseFormatted && detail.targetReleaseDate ? (
        <DetailMetaTag tone="release">
          Release: {releaseFormatted}
        </DetailMetaTag>
      ) : null}
    </div>
  );
}

function teamCompositionHref(detail: ProjectDetailPanelPayload): string {
  const params = new URLSearchParams({ project: detail.projectKey });
  if (detail.monthKey) {
    params.set("month", detail.monthKey);
  }
  return `/teams/composition?${params.toString()}`;
}

type DetailKpiCell = {
  label: string;
  value: string;
  href?: string;
  tooltip?: string;
  contextLine?: ProjectDetailKpiContextLine;
};

function DetailKpiContextLine({ line }: { line?: ProjectDetailKpiContextLine }) {
  return (
    <p
      className={cn(
        "mt-0.5 min-h-[0.6rem] text-[0.6rem] tabular-nums leading-none",
        !line && "invisible",
        line?.tone === "positive" && "text-[var(--overview-metric-billable)]",
        line?.tone === "negative" && "text-destructive",
        line?.tone === "neutral" && "text-foreground",
      )}
      aria-hidden={!line}
    >
      {line?.text ?? "\u00a0"}
    </p>
  );
}

function DetailKpiCard({ cell }: { cell: DetailKpiCell }) {
  const body = (
    <>
      <DetailKpiLabel label={cell.label} tooltip={cell.tooltip} />
      <p
        className={cn(
          "mt-0.5 text-xs font-semibold tabular-nums text-foreground",
          cell.href && "flex items-center gap-1",
        )}
      >
        <span>{cell.value}</span>
        {cell.href ? (
          <Link2
            className="size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </p>
      <DetailKpiContextLine line={cell.contextLine} />
    </>
  );

  if (cell.href) {
    return (
      <a
        href={cell.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${cell.label}: ${cell.value}. Opens team composition in a new tab.`}
        className={cn(
          dashboardSurfaceClass(
            "group block p-2 transition-[background-color,box-shadow] duration-150",
          ),
          "cursor-pointer hover:bg-muted/30 hover:ring-foreground/15",
        )}
      >
        {body}
      </a>
    );
  }

  return <div className={cn(dashboardSurfaceClass("p-2"))}>{body}</div>;
}

function DetailKpiLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <p
      className="flex items-center gap-0.5 text-[0.55rem] font-medium uppercase leading-none tracking-wider text-muted-foreground"
      title={tooltip}
    >
      <span className={cn(tooltip && "min-w-0 truncate whitespace-nowrap")}>{label}</span>
      {tooltip ? (
        <>
          <CircleHelp className="size-2.5 shrink-0 opacity-50" aria-hidden />
          <span className="sr-only">{tooltip}</span>
        </>
      ) : null}
    </p>
  );
}

const PROJECT_DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "delivery", label: "Delivery" },
  { id: "team", label: "Team" },
  { id: "quality", label: "Quality" },
  { id: "operations", label: "Operations" },
] as const;

type ProjectDetailTabId = (typeof PROJECT_DETAIL_TABS)[number]["id"];

function ProjectDetailTabs({
  activeTab,
  onChange,
}: {
  activeTab: ProjectDetailTabId;
  onChange: (tab: ProjectDetailTabId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Project detail sections"
      className="flex gap-0.5 overflow-x-auto border-b border-border/70 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-slot="projects-detail-tabs"
    >
      {PROJECT_DETAIL_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px shrink-0 cursor-pointer border-b-2 px-2.5 pb-2 pt-0.5 text-[0.7rem] font-medium leading-none transition-colors",
              isActive
                ? "border-[var(--overview-metric-planned)] text-[var(--overview-metric-planned)]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ProjectDetailComingSoon() {
  return (
    <div
      className="flex min-h-[10rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center"
      data-slot="projects-detail-coming-soon"
    >
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}

function ProjectDetailOverviewTab({
  detail,
  roleRows,
  executionDescription,
}: {
  detail: ProjectDetailPanelPayload;
  roleRows: ReturnType<typeof mergeRoleHoursForChart>;
  executionDescription: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailChartSection
          title="Burn Rate"
          description={executionDescription}
        >
          <ProjectExecutionChart
            series={detail.executionSeries}
            granularity={detail.executionGranularity}
            periodStart={detail.executionPeriodStart}
            periodEnd={detail.executionPeriodEnd}
            ariaLabel={
              detail.executionGranularity === "month"
                ? detail.executionPeriodStart && detail.executionPeriodEnd
                  ? `Planned versus logged hours by month from ${detail.executionPeriodStart} to ${detail.executionPeriodEnd}`
                  : "Planned versus logged hours by month"
                : "Planned versus logged hours by day in the selected month"
            }
          />
        </DetailChartSection>
        <DetailChartSection
          title="Velocity trend"
          description="Logged hours per week (last 6 weeks)"
        >
          <ProjectVelocityChart
            weeks={detail.velocityWeeks}
            ariaLabel="Weekly logged hours"
          />
        </DetailChartSection>
      </div>

      {detail.monthLabel ? (
        <section className="space-y-1.5">
          <div>
            <h3 className="text-[0.7rem] font-medium text-foreground">
              Hours by role ({detail.monthLabel})
            </h3>
            <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
              Planned and logged by role
            </p>
          </div>
          <ProjectRoleGroupedChart
            rows={roleRows}
            ariaLabel="Planned and logged hours by role"
          />
        </section>
      ) : null}
    </>
  );
}

const DETAIL_KPI_CELLS = (
  detail: ProjectDetailPanelPayload,
): DetailKpiCell[] => {
  const contextLines = buildProjectDetailKpiContextLines(detail);

  return [
  {
    label: "Budget",
    value: detail.budgetHours != null ? fmtHoursKpi(detail.budgetHours) : "—",
  },
  {
    label: "Projected",
    value:
      detail.projectedHoursAtCompletion != null
        ? fmtHoursKpi(detail.projectedHoursAtCompletion)
        : "—",
    contextLine: contextLines.projected,
  },
  {
    label: "Planned",
    value: fmtHoursKpi(detail.plannedHoursTotal),
    contextLine: contextLines.planned,
  },
  {
    label: "Logged",
    value: fmtHoursKpi(detail.loggedHoursTotal),
    contextLine: contextLines.logged,
  },
  { label: "Billable", value: fmtHoursKpi(detail.billableHoursTotal) },
  {
    label: "Budget used",
    value: detail.budgetUsedPct != null ? fmtPct(detail.budgetUsedPct) : "—",
  },
  {
    label: "Plan gap",
    value: fmtPlanVarianceKpi(detail.planVarianceHours),
    tooltip: PROJECT_DETAIL_KPI_TOOLTIPS.planGap,
  },
  {
    label: "Team Size",
    value: String(detail.teamSize),
    href: teamCompositionHref(detail),
  },
];
};

function DetailChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-1.5">
      <div>
        <h3 className="text-[0.7rem] font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 text-[0.6rem] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function ProjectsProjectDetailPanel({
  detail,
}: {
  detail: ProjectDetailPanelPayload;
}) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTabId>("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [detail.projectKey]);

  const title = projectCardTitle({
    projectKey: detail.projectKey,
    projectName: detail.projectName,
  });

  const roleRows = mergeRoleHoursForChart(
    detail.teamBreakdown,
    detail.roleAllocation,
  );

  const executionDescription =
    detail.executionGranularity === "month"
      ? detail.executionPeriodEnd
        ? "Planned vs logged hours by month through project end date"
        : "Planned vs logged hours by month from project start"
      : detail.monthLabel
        ? `Planned vs logged hours by day in ${detail.monthLabel}`
        : "Planned vs logged hours by day in the selected month";

  return (
    <DataSectionPanel
      dataSlot="projects-overview-detail"
      className="gap-3 xl:sticky xl:top-4"
    >
      <DataSectionPanelHeader
        title={title}
        description={<ProjectDetailMetaRow detail={detail} />}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {DETAIL_KPI_CELLS(detail).map((cell) => (
          <DetailKpiCard key={cell.label} cell={cell} />
        ))}
      </div>

      <ProjectDetailTabs activeTab={activeTab} onChange={setActiveTab} />

      <div
        role="tabpanel"
        aria-label={
          PROJECT_DETAIL_TABS.find((tab) => tab.id === activeTab)?.label ??
          "Project detail"
        }
        className="flex flex-col gap-3"
      >
        {activeTab === "overview" ? (
          <ProjectDetailOverviewTab
            detail={detail}
            roleRows={roleRows}
            executionDescription={executionDescription}
          />
        ) : (
          <ProjectDetailComingSoon />
        )}
      </div>
    </DataSectionPanel>
  );
}
