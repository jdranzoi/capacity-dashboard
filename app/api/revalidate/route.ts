import { NextResponse } from 'next/server'

import { invalidateDashboardCache } from '@/lib/cache/invalidate-dashboard-cache'

type RevalidateBody = {
  snapshotId?: string
}

function readSecret(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim() || null
  }
  return request.headers.get('x-revalidate-secret')?.trim() || null
}

/**
 * POST /api/revalidate
 * Invalidates dashboard cache tags after sync-v2. Secured by DASHBOARD_CACHE_REVALIDATE_SECRET.
 *
 * Body (optional): { "snapshotId": "<uuid>" }
 */
export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_CACHE_REVALIDATE_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'Revalidate secret is not configured on this deployment.' },
      { status: 503 }
    )
  }

  const provided = readSecret(request)
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let snapshotId: string | undefined
  try {
    const body = (await request.json()) as RevalidateBody
    if (typeof body.snapshotId === 'string' && body.snapshotId.length > 0) {
      snapshotId = body.snapshotId
    }
  } catch {
    // Empty body is valid — invalidate global tags only.
  }

  invalidateDashboardCache({ snapshotId })

  return NextResponse.json({
    ok: true,
    tags: ['overview-months', 'month-facts', ...(snapshotId ? [`snapshot-${snapshotId}`] : [])],
  })
}
