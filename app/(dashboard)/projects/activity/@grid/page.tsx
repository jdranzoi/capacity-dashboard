import { connection } from 'next/server'

import { ProjectsActivityGridBlock } from '@/components/projects/activity/projects-activity-grid-block'
import {
  activityListSlotKey,
  pickActivityListSearchParams,
} from '@/lib/projects/activity/activity-route-filters'

type ProjectsActivityGridSlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProjectsActivityGridSlot({
  searchParams,
}: ProjectsActivityGridSlotProps) {
  await connection()
  const listParams = pickActivityListSearchParams(await searchParams)

  return (
    <ProjectsActivityGridBlock
      key={activityListSlotKey(listParams)}
      listParams={listParams}
    />
  )
}
