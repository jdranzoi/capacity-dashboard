'use client'

import { useMemo } from 'react'

import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  buildMonthVisibilitySegmentOptions,
  type PlanningMonthVisibilityFilter,
} from '@/lib/capacity/planning/planning-month-visibility'

export function PlanningMonthVisibilityControl({
  monthKeys,
  monthLabels,
  value,
  onChange,
}: {
  monthKeys: string[]
  monthLabels: Record<string, string>
  value: PlanningMonthVisibilityFilter
  onChange: (value: PlanningMonthVisibilityFilter) => void
}) {
  const options = useMemo(
    () => buildMonthVisibilitySegmentOptions(monthKeys, monthLabels),
    [monthKeys, monthLabels]
  )

  return (
    <SegmentedControl
      label="Months"
      value={value}
      onChange={onChange}
      options={options}
    />
  )
}
