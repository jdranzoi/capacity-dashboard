'use client'

import { useMemo } from 'react'

import { useTeamsRoutePending } from '@/components/teams/_shared/teams-route-pending-shell'
import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { FilterSuggestInput } from '@/components/ui/filter-suggest-input'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { CompositionFilterSuggestions } from '@/lib/teams/composition/load-composition-filter-suggestions'
import type { TeamsRouteFilters } from '@/lib/teams/shared/teams-route-filters'

export function TeamsCompositionFilters({
  monthOptions,
  monthKey,
  routeFilters,
  suggestions,
}: {
  monthOptions: OverviewMonthOption[]
  monthKey: string
  routeFilters: TeamsRouteFilters
  suggestions: CompositionFilterSuggestions
}) {
  const teamsPending = useTeamsRoutePending()

  const personDisplay = routeFilters.personQuery ?? ''
  const projectDisplay = routeFilters.projectQuery ?? ''

  const personSuggestions = useMemo(
    () => suggestions.people.map((option) => ({ ...option })),
    [suggestions.people]
  )
  const projectSuggestions = useMemo(
    () => suggestions.projects.map((option) => ({ ...option })),
    [suggestions.projects]
  )

  return (
    <div className="flex flex-wrap items-end gap-3" data-slot="teams-composition-filters">
      <DashboardFilterField label="Period">
        <OverviewMonthPicker options={monthOptions} selectedMonthKey={monthKey} />
      </DashboardFilterField>
      <FilterSuggestInput
        paramKey="q"
        label="Name"
        placeholder="Search person…"
        ariaLabel="Filter projects by team member name"
        selectedParamValue={routeFilters.personQuery}
        displayValue={personDisplay}
        suggestions={personSuggestions}
        pendingNavigation={teamsPending}
        containerClassName="min-w-[12rem] sm:max-w-md"
      />
      <FilterSuggestInput
        paramKey="project"
        label="Project"
        placeholder="Search project…"
        ariaLabel="Filter projects by project key or name"
        selectedParamValue={routeFilters.projectQuery}
        displayValue={projectDisplay}
        suggestions={projectSuggestions}
        pendingNavigation={teamsPending}
        containerClassName="min-w-[12rem] sm:max-w-md"
      />
    </div>
  )
}
