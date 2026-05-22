'use client'

import { useMemo } from 'react'

import { useTeamRoutePending } from '@/components/team/team-route-pending-shell'
import { FilterSuggestInput } from '@/components/ui/filter-suggest-input'
import type { TeamFilterSelectOption } from '@/lib/team/load-team-filter-options'

export function TeamFilterSuggestInput({
  paramKey,
  label,
  placeholder,
  ariaLabel,
  options,
  selectedParamValue,
}: {
  paramKey: 'role' | 'zone' | 'project'
  label: string
  placeholder: string
  ariaLabel: string
  options: TeamFilterSelectOption[]
  selectedParamValue: string | null
}) {
  const teamPending = useTeamRoutePending()

  const displayValue = useMemo(() => {
    if (!selectedParamValue) return ''
    return options.find((option) => option.value === selectedParamValue)?.label ?? ''
  }, [options, selectedParamValue])

  const suggestions = useMemo(
    () => options.map((option) => ({ value: option.value, label: option.label })),
    [options]
  )

  return (
    <FilterSuggestInput
      paramKey={paramKey}
      label={label}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      selectedParamValue={selectedParamValue}
      displayValue={displayValue}
      suggestions={suggestions}
      pendingNavigation={teamPending}
      containerClassName="min-w-[7.5rem] sm:max-w-[11.5rem]"
    />
  )
}
