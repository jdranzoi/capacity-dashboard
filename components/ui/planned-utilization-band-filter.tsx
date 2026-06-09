'use client'

import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  PLANNED_UTILIZATION_BAND_OPTIONS,
  type PlannedUtilizationBand,
} from '@/lib/domain/planned-utilization-band'
import { cn } from '@/lib/utils'

export function PlannedUtilizationBandFilter({
  value,
  onChange,
  label = 'Utilization',
  className,
}: {
  value: PlannedUtilizationBand
  onChange: (value: PlannedUtilizationBand) => void
  label?: string
  className?: string
}) {
  return (
    <SegmentedControl
      label={label}
      value={value}
      onChange={onChange}
      options={PLANNED_UTILIZATION_BAND_OPTIONS}
      className={cn(className)}
    />
  )
}
