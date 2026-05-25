import { NextResponse } from 'next/server'

import { invalidateDashboardCache } from '@/lib/cache/invalidate-dashboard-cache'
import { createAuthClient } from '@/lib/supabase/server'

type SyncNotifyBody = {
  snapshotId?: string
}

/**
 * POST /api/sync-notify
 * Busts dashboard data cache tags when an open tab detects a new sync_snapshot.
 * Session auth only (unlike POST /api/revalidate, which uses the ingestion secret).
 */
export async function POST(request: Request) {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let snapshotId: string | undefined
  try {
    const body = (await request.json()) as SyncNotifyBody
    if (typeof body.snapshotId === 'string' && body.snapshotId.length > 0) {
      snapshotId = body.snapshotId
    }
  } catch {
    // Empty body — invalidate global tags only.
  }

  invalidateDashboardCache({ snapshotId })

  return NextResponse.json({ ok: true, snapshotId: snapshotId ?? null })
}
