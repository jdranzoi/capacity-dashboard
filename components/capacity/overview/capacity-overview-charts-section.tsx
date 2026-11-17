import { WeeklyEvolutionChart } from '@/components/overview/overview-workload-charts'
import { CapacityOverviewRoleSummary } from '@/components/capacity/overview/capacity-overview-role-summary'
import type { CapacityOverviewPayload } from '@/lib/capacity/overview/load-capacity-overview'

/** Month in progress: weekly evolution and role summary, month to date. */
export function CapacityOverviewMonthToDateSection({
  data,
  monthLabel,
}: {
  data: CapacityOverviewPayload
  monthLabel: string
}) {
  return (
    <section className="space-y-3" data-slot="capacity-overview-month-to-date">
      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Month to date · {monthLabel}
        </h2>
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
          Weekly evolution and roles for the month in progress.
        </p>
      </div>
      <div className="grid min-h-[22rem] gap-3 lg:grid-cols-[2fr_3fr] lg:items-stretch">
        <WeeklyEvolutionChart weeks={data.weeks} className="min-h-[22rem]" />
        <CapacityOverviewRoleSummary
          rows={data.roleSummary}
          className="min-h-[22rem]"
        />
      </div>
    </section>
  );
}
