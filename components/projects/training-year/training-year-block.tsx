import { connection } from 'next/server'

import { DashboardSectionHeader } from '@/components/layout/dashboard-section-header'
import { TrainingYearGroupedBarChart } from '@/components/projects/training-year/training-year-grouped-bar-chart'
import { TrainingYearKpiRow } from '@/components/projects/training-year/training-year-kpi-row'
import { TrainingYearRoleTable } from '@/components/projects/training-year/training-year-role-table'
import { TrainingYearTaxonomySection } from '@/components/projects/training-year/training-year-taxonomy-section'
import { SectionDataError, SectionEmptyState } from '@/components/ui/section-data-states'
import { loadTrainingYearDashboard } from '@/lib/projects/training-year/load-training-year'
import type { TrainingYearFilters } from '@/lib/projects/training-year/training-year-filters'

export async function TrainingYearBlock({
  filters,
}: {
  filters: TrainingYearFilters
}) {
  await connection()
  const { data, error } = await loadTrainingYearDashboard(filters)
  if (error) return <SectionDataError message={error} />
  if (!data) {
    return (
      <SectionEmptyState message="No MCT training hours for this year yet. Run npm run sync:training." />
    )
  }

  const yearSpan =
    data.years.length > 1 ? `${data.years[0]}–${data.years[data.years.length - 1]}` : String(data.year)
  const sliceBits = [
    filters.monthKey
      ? data.monthHours.bars.find((bar) => bar.key === filters.monthKey)?.label
      : null,
    filters.roleKey
      ? data.roleTable.rows.find((row) => row.key === filters.roleKey)?.label ??
        data.roleHours.bars.find((bar) => bar.key === filters.roleKey)?.label
      : null,
    filters.versionKey,
    filters.componentKey,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-3" data-slot="training-year-page">
      <DashboardSectionHeader
        title="Training year"
        subtitle={
          sliceBits.length > 0
            ? `${data.year} · ${sliceBits.join(' · ')}. Click the same bar or row to clear.`
            : `${data.year} · ${data.kpis.throughLabel} vs ${yearSpan}. Click a bar to slice.`
        }
      />
      <TrainingYearKpiRow kpis={data.kpis} />
      <div
        className="grid gap-3 lg:grid-cols-2"
        data-slot="training-year-chart-row"
        data-row="month"
      >
        <TrainingYearGroupedBarChart chart={data.monthHours} selectedKey={filters.monthKey} />
        <TrainingYearGroupedBarChart chart={data.monthCounts} selectedKey={filters.monthKey} />
      </div>
      <div
        className="grid gap-3 lg:grid-cols-3"
        data-slot="training-year-chart-row"
        data-row="role"
      >
        <TrainingYearGroupedBarChart chart={data.roleCounts} selectedKey={filters.roleKey} />
        <TrainingYearGroupedBarChart chart={data.roleHours} selectedKey={filters.roleKey} />
        <TrainingYearRoleTable table={data.roleTable} selectedRoleKey={filters.roleKey} />
      </div>
      <TrainingYearTaxonomySection
        versions={data.versions}
        areas={data.areas}
        selectedVersionKey={filters.versionKey}
        selectedComponentKey={filters.componentKey}
      />
    </div>
  )
}
