import { NextResponse } from 'next/server'

import { getLatestSyncSnapshotLive } from '@/lib/data/latest-sync-snapshot'
import { createAuthClient } from '@/lib/supabase/server'

/**
 * GET /api/sync-version
 * Lightweight probe for open tabs — returns latest sync_snapshot id (no Next cache).
 */
export async function GET() {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const latest = await getLatestSyncSnapshotLive()

  if (!latest) {
    return NextResponse.json({ snapshotId: null, syncedAt: null })
  }

  return NextResponse.json(
    { snapshotId: latest.id, syncedAt: latest.createdAt },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
