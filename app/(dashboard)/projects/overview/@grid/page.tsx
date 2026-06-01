import { connection } from 'next/server'

import { ProjectsOverviewGridBlock } from '@/components/projects/overview/projects-overview-grid-block'
import { pickProjectsListSearchParams } from '@/lib/projects/overview/projects-list-search-params'
import { projectsListSlotKey } from '@/lib/projects/overview/projects-list-slot-key'

type ProjectsGridSlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Parallel slot: progress grid only (list filters; no `project` param). */
export default async function ProjectsOverviewGridSlot({
  searchParams,
}: ProjectsGridSlotProps) {
  await connection()
  const raw = await searchParams
  const listParams = pickProjectsListSearchParams(raw)

  return (
    <ProjectsOverviewGridBlock
      key={projectsListSlotKey(listParams)}
      listParams={listParams}
    />
  )
}
