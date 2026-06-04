'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { useTeamsRoutePending } from '@/components/teams/_shared/teams-route-pending-shell'
import { TeamsMonthPicker } from '@/components/teams/_shared/teams-month-picker'
import { FilterSuggestInput } from '@/components/ui/filter-suggest-input'
import { DashboardFilterField } from '@/components/layout/dashboard-filter-field'
import type { FilterSuggestOption } from '@/lib/format/filter-suggest-utils'
import type {
  CollaborationCategoryOption,
  CollaborationNetworkPayload,
} from '@/lib/teams/collaboration/collaboration-types'
import { cn } from '@/lib/utils'

function NativeSelect({
  ariaLabel,
  value,
  options,
  paramKey,
}: {
  ariaLabel: string
  value: string
  options: { value: string; label: string }[]
  paramKey: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pending = useTeamsRoutePending()

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramKey, next)
      const query = params.toString()
      const href = query ? `${pathname}?${query}` : pathname
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [paramKey, pathname, pending, router, searchParams]
  )

  const isPending = pending?.isPending ?? false

  return (
    <div className="relative inline-flex">
      <select
        aria-label={ariaLabel}
        aria-busy={isPending}
        value={value}
        disabled={isPending}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-9 w-full min-w-[10rem] appearance-none rounded-lg border border-border bg-muted/25 py-1.5 pr-8 pl-3 text-sm text-foreground',
          'ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isPending ? 'cursor-wait opacity-80' : 'cursor-pointer'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending ? (
        <Loader2
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : (
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
    </div>
  )
}

export function CollaborationFilters({
  data,
  personSuggestions,
}: {
  data: CollaborationNetworkPayload
  personSuggestions: FilterSuggestOption[]
}) {
  const pending = useTeamsRoutePending()
  const categoryOptions: CollaborationCategoryOption[] = data.categoryOptions

  return (
    <div className="flex flex-wrap items-end gap-3" data-slot="collaboration-filters">
      <DashboardFilterField label="Month">
        <TeamsMonthPicker options={data.monthOptions} selectedMonthKey={data.monthKey} />
      </DashboardFilterField>
      <DashboardFilterField label="Project category">
        <NativeSelect
          ariaLabel="Project category"
          paramKey="category"
          value={data.category}
          options={categoryOptions}
        />
      </DashboardFilterField>
      <FilterSuggestInput
        paramKey="q"
        label="Person"
        placeholder="Search person…"
        ariaLabel="Focus the graph on a person"
        selectedParamValue={data.personQuery}
        displayValue={data.personQuery ?? ''}
        suggestions={personSuggestions}
        pendingNavigation={pending}
        containerClassName="min-w-[16rem] sm:max-w-xs"
      />
    </div>
  )
}
