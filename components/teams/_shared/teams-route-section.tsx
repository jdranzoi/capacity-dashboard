'use client'

import type { ReactNode } from 'react'

import { useTeamsRoutePending } from '@/components/teams/_shared/teams-route-pending-shell'

export function TeamsRouteSection({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const ctx = useTeamsRoutePending()
  if (ctx?.isPending) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
