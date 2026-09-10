'use client'

import { useState } from 'react'

import {
  TrainingYearTaxonomyChart,
  type TrainingYearTaxonomyUnit,
} from '@/components/projects/training-year/training-year-taxonomy-chart'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { TrainingYearTaxonomyChartSpec } from '@/lib/projects/training-year/training-year-types'

const UNIT_OPTIONS = [
  { value: 'hours', label: 'Hours' },
  { value: 'share', label: 'Share' },
] as const satisfies readonly { value: TrainingYearTaxonomyUnit; label: string }[]

export function TrainingYearTaxonomySection({
  versions,
  areas,
  selectedVersionKey,
  selectedComponentKey,
}: {
  versions: TrainingYearTaxonomyChartSpec
  areas: TrainingYearTaxonomyChartSpec
  selectedVersionKey: string | null
  selectedComponentKey: string | null
}) {
  const [unit, setUnit] = useState<TrainingYearTaxonomyUnit>('hours')

  return (
    <div className="flex flex-col gap-2" data-slot="training-year-taxonomy-section">
      <div className="flex items-end justify-end">
        <SegmentedControl
          label="Bar length"
          value={unit}
          onChange={setUnit}
          options={UNIT_OPTIONS}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <TrainingYearTaxonomyChart
          chart={versions}
          unit={unit}
          selectedKey={selectedVersionKey}
        />
        <TrainingYearTaxonomyChart
          chart={areas}
          unit={unit}
          selectedKey={selectedComponentKey}
        />
      </div>
    </div>
  )
}
