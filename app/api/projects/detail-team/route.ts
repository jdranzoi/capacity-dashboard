import { NextResponse } from 'next/server'

import {
  isProjectDetailTeamScope,
  loadProjectDetailTeam,
} from '@/lib/projects/overview/load-project-detail-team'
import { createAuthClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectKey = searchParams.get('project')?.trim()
  const monthKey = searchParams.get('month')?.trim() || null
  const scopeRaw = searchParams.get('scope')?.trim() ?? ''

  if (!projectKey) {
    return NextResponse.json({ error: 'Missing project' }, { status: 400 })
  }
  if (!isProjectDetailTeamScope(scopeRaw)) {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
  }

  const result = await loadProjectDetailTeam({
    projectKey,
    monthKey,
    scope: scopeRaw,
  })

  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: 500 })
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
