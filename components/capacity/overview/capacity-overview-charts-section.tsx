import { WeeklyEvolutionChart } from '@/components/overview/overview-workload-charts'
import { CapacityOverviewRoleSummary } from '@/components/capacity/overview/capacity-overview-role-summary'
import type { CapacityOverviewPayload } from '@/lib/capacity/overview/load-capacity-overview'

export function CapacityOverviewTrendsSection({ data }: { data: CapacityOverviewPayload }) {
  return (
    <section className="space-y-3" data-slot="capacity-overview-trends">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Trends
      </p>
      <div className="grid min-h-[22rem] gap-4 lg:grid-cols-[2fr_3fr] lg:items-stretch">
        <WeeklyEvolutionChart weeks={data.weeks} className="min-h-[22rem]" />
        <CapacityOverviewRoleSummary rows={data.roleSummary} className="min-h-[22rem]" />
      </div>
    </section>
  )
}
