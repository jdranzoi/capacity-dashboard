'use client'

import { useMemo } from 'react'

import { useProjectsRoutePending } from '@/components/projects/_shared/projects-route-pending-shell'
import { FilterSuggestInput } from '@/components/ui/filter-suggest-input'
import type { FilterSuggestOption } from '@/lib/format/filter-suggest-utils'

export function ProjectsProgressPmFilter({
  pmQuery,
  suggestions,
}: {
  pmQuery: string | null
  suggestions: FilterSuggestOption[]
}) {
  const pending = useProjectsRoutePending()
  const displayValue = pmQuery ?? ''

  const pmSuggestions = useMemo(
    () => suggestions.map((option) => ({ ...option })),
    [suggestions]
  )

  return (
    <FilterSuggestInput
      paramKey="pm"
      label="Project manager"
      placeholder="Search PM…"
      ariaLabel="Filter projects by project manager name"
      selectedParamValue={pmQuery}
      displayValue={displayValue}
      suggestions={pmSuggestions}
      pendingNavigation={pending}
      containerClassName="min-w-[12rem] sm:max-w-xs"
    />
  )
}
