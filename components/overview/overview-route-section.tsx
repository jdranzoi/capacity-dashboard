'use client'

import type { ReactNode } from 'react'

import { useOverviewRoutePending } from '@/components/overview/overview-route-pending-shell'

/**
 * During `?month=` transitions, show the section fallback instead of stale RSC content
 * (Suspense does not always re-trigger on search-only navigations).
 */
export function OverviewRouteSection({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const ctx = useOverviewRoutePending()
  if (ctx?.isPending) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
