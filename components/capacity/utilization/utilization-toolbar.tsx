import { CapacityFilterSuggestInput } from '@/components/capacity/_shared/capacity-filter-suggest-input'
import { CapacityMonthPicker } from '@/components/capacity/_shared/capacity-month-picker'
import type { WorkforceFilterOptionsPayload } from '@/lib/workforce/load-filter-options'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { CapacityRouteFilters } from '@/lib/capacity/shared/capacity-route-filters'

export function UtilizationToolbar({
  monthPicker,
  filterOptions,
  routeFilters,
}: {
  monthPicker: { options: OverviewMonthOption[]; selectedMonthKey: string } | null
  filterOptions: WorkforceFilterOptionsPayload
  routeFilters: CapacityRouteFilters
}) {
  return (
    <div
      className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
      data-slot="capacity-utilization-toolbar"
    >
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Period
        </span>
        {monthPicker && monthPicker.options.length > 0 ? (
          <CapacityMonthPicker
            options={monthPicker.options}
            selectedMonthKey={monthPicker.selectedMonthKey}
          />
        ) : (
          <div className="h-9 min-w-[11.5rem] rounded-lg border border-border bg-muted/20" />
        )}
      </div>

      <CapacityFilterSuggestInput
        paramKey="role"
        label="Role"
        placeholder="Pick role…"
        ariaLabel="Filter utilization by role"
        options={filterOptions.roles}
        selectedParamValue={routeFilters.roleKey}
      />
      <CapacityFilterSuggestInput
        paramKey="project"
        label="Project"
        placeholder="Search project…"
        ariaLabel="Filter utilization by project"
        options={filterOptions.projects}
        selectedParamValue={routeFilters.projectKey}
      />
      <CapacityFilterSuggestInput
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
