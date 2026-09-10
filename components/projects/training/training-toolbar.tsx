'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import { OverviewMonthPicker } from '@/components/overview/overview-month-picker'
import { FilterSuggestInput } from '@/components/ui/filter-suggest-input'
import { Button } from '@/components/ui/button'
import { useResolvedSectionRoutePending } from '@/components/ui/use-resolved-section-route-pending'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import type { TrainingRouteFilters } from '@/lib/projects/training/training-route-filters'

export function TrainingToolbar({
  monthOptions,
  filters,
  personSuggestions,
}: {
  monthOptions: OverviewMonthOption[]
  filters: TrainingRouteFilters
  personSuggestions: Array<{ value: string; label: string }>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pending = useResolvedSectionRoutePending()
  const selectedMonth = filters.monthKey ?? monthOptions[0]?.monthKey ?? ''

  const toggleMissing = () => {
    const next = new URLSearchParams(searchParams.toString())
    if (filters.missingOnly) next.delete('missing')
    else next.set('missing', '1')
    const query = next.toString()
    const href = query ? `${pathname}?${query}` : pathname
    if (pending) pending.navigateWithTransition(href)
    else router.push(href, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-end gap-4" data-slot="training-toolbar">
      <DashboardFilterField label="Month">
        <OverviewMonthPicker options={monthOptions} selectedMonthKey={selectedMonth} />
      </DashboardFilterField>
      <DashboardFilterField label="Person">
        <FilterSuggestInput
          paramKey="q"
          label="Person"
          placeholder="Filter by assignee"
          ariaLabel="Filter training activities by person"
          selectedParamValue={filters.personQuery}
          displayValue={filters.personQuery ?? ''}
          suggestions={personSuggestions}
        />
      </DashboardFilterField>
      <Button
        type="button"
        variant={filters.missingOnly ? 'default' : 'outline'}
        size="sm"
        onClick={toggleMissing}
        aria-pressed={filters.missingOnly}
      >
        Missing fields
      </Button>
    </div>
  )
}
