import { TeamFilterSuggestInput } from '@/components/team/team-filter-suggest-input'
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

      <TeamFilterSuggestInput
        paramKey="role"
        label="Role"
        placeholder="Pick role…"
        ariaLabel="Filter utilization by role"
        options={filterOptions.roles}
        selectedParamValue={routeFilters.roleKey}
      />
      <TeamFilterSuggestInput
        paramKey="project"
        label="Project"
        placeholder="Search project…"
        ariaLabel="Filter utilization by project"
        options={filterOptions.projects}
        selectedParamValue={routeFilters.projectKey}
      />
      <TeamFilterSuggestInput
        paramKey="zone"
        label="Region"
        placeholder="Pick region…"
        ariaLabel="Filter utilization by holiday region"
        options={filterOptions.zones}
        selectedParamValue={routeFilters.zoneKey}
      />
    </div>
  )
}
