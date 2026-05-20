'use client'

import type { ReactNode } from 'react'

import { useTeamRoutePending } from '@/components/team/team-route-pending-shell'

export function TeamRouteSection({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const ctx = useTeamRoutePending()
  if (ctx?.isPending) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
