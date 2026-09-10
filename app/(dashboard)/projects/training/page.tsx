import { Suspense } from 'react'
import { connection } from 'next/server'

import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import {
  ProjectsKpiRowSkeleton,
  ProjectsPageSkeleton,
} from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsRoutePendingShell } from '@/components/projects/_shared/projects-route-pending-shell'
import { TrainingBodyBlock } from '@/components/projects/training/training-body-block'
import { TrainingChromeBlock } from '@/components/projects/training/training-chrome-block'
import { TrainingKpiBlock } from '@/components/projects/training/training-kpi-block'
import { pickTrainingSearchParams, trainingSlotKey } from '@/lib/projects/training/training-route-filters'

type TrainingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function TrainingPage({ searchParams }: TrainingPageProps) {
  return (
    <ProjectsRoutePendingShell>
      <Suspense fallback={<ProjectsPageSkeleton />}>
        <TrainingMainSlot searchParams={searchParams} />
      </Suspense>
    </ProjectsRoutePendingShell>
  )
}

async function TrainingMainSlot({ searchParams }: TrainingPageProps) {
  await connection()
  const filters = pickTrainingSearchParams(await searchParams)
  const slotKey = trainingSlotKey(filters)

  return (
    <div className="flex flex-col gap-6">
      <Suspense key={`chrome-${slotKey}`} fallback={<DashboardSectionHeaderSkeleton filterCount={3} />}>
        <TrainingChromeBlock filters={filters} />
      </Suspense>
      <Suspense key={`kpi-${slotKey}`} fallback={<ProjectsKpiRowSkeleton />}>
        <TrainingKpiBlock filters={filters} />
      </Suspense>
      <Suspense key={`body-${slotKey}`} fallback={<ProjectsPageSkeleton />}>
        <TrainingBodyBlock filters={filters} />
      </Suspense>
    </div>
  )
}
