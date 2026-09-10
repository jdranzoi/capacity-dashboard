import { Suspense } from 'react'
import { connection } from 'next/server'

import { ProjectsPageSkeleton } from '@/components/projects/_shared/projects-section-skeletons'
import { ProjectsRoutePendingShell } from '@/components/projects/_shared/projects-route-pending-shell'
import { TrainingYearBlock } from '@/components/projects/training-year/training-year-block'
import {
  pickTrainingYearSearchParams,
  trainingYearSlotKey,
} from '@/lib/projects/training-year/training-year-filters'

type TrainingYearPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function TrainingYearPage({ searchParams }: TrainingYearPageProps) {
  return (
    <ProjectsRoutePendingShell>
      <Suspense fallback={<ProjectsPageSkeleton />}>
        <TrainingYearMainSlot searchParams={searchParams} />
      </Suspense>
    </ProjectsRoutePendingShell>
  )
}

async function TrainingYearMainSlot({ searchParams }: TrainingYearPageProps) {
  await connection()
  const filters = pickTrainingYearSearchParams(await searchParams)
  const slotKey = trainingYearSlotKey(filters)

  return (
    <Suspense key={slotKey} fallback={<ProjectsPageSkeleton />}>
      <TrainingYearBlock filters={filters} />
    </Suspense>
  )
}
