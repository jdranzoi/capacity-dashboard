import { connection } from 'next/server'

import { TeamStaticHeader } from '@/components/team/team-static-header'
import { perfSpan } from '@/lib/dev/perf-log'
import { getTeamMonthSelection } from '@/lib/team/team-page-cache'

export async function TeamHeaderBlock({ monthStr }: { monthStr: string | undefined }) {
  return perfSpan('team/header', async () => {
    await connection()
    const { selected } = await getTeamMonthSelection(monthStr)
    return <TeamStaticHeader referenceMonthLabel={selected?.label} />
  })
}
