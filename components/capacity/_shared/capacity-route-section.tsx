'use client'

import type { ReactNode } from 'react'

import { useCapacityRoutePending } from '@/components/capacity/_shared/capacity-route-pending-shell'

export function CapacityRouteSection({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const ctx = useCapacityRoutePending()
  if (ctx?.isPending) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
