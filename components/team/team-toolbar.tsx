import { TeamFilterSelect } from '@/components/team/team-filter-select'
import { TeamMonthPicker } from '@/components/team/team-month-picker'
import type { TeamFilterOptionsPayload } from '@/lib/team/load-team-filter-options'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { TeamRouteFilters } from '@/lib/team/team-route-filters'

export function TeamToolbar({
  monthPicker,
  filterOptions,
  routeFilters,
}: {
  monthPicker: { options: OverviewMonthOption[]; selectedMonthKey: string } | null
  filterOptions: TeamFilterOptionsPayload
  routeFilters: TeamRouteFilters
}) {
  return (
    <div
      className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
      data-slot="team-toolbar"
    >
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Period
        </span>
        {monthPicker && monthPicker.options.length > 0 ? (
          <TeamMonthPicker
            options={monthPicker.options}
            selectedMonthKey={monthPicker.selectedMonthKey}
          />
        ) : (
          <div className="h-9 min-w-[11.5rem] rounded-lg border border-border bg-muted/20" />
        )}
      </div>

      <TeamFilterSelect
        paramKey="role"
        label="Role"
        options={filterOptions.roles}
        selectedValue={routeFilters.roleKey}
      />
      <TeamFilterSelect
        paramKey="project"
        label="Project"
        options={filterOptions.projects}
        selectedValue={routeFilters.projectKey}
      />
      <TeamFilterSelect
        paramKey="zone"
        label="Region"
        options={filterOptions.zones}
        selectedValue={routeFilters.zoneKey}
      />
    </div>
  )
}
