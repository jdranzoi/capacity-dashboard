'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type SyncFreshness = {
  snapshotId: string | null
  syncedAt: string | null
}

type SyncFreshnessContextValue = {
  freshness: SyncFreshness
  setFreshness: (next: SyncFreshness) => void
}

const SyncFreshnessContext = createContext<SyncFreshnessContextValue | null>(
  null,
)

export function SyncFreshnessProvider({
  initial,
  children,
}: {
  initial: SyncFreshness
  children: ReactNode
}) {
  const [freshness, setFreshness] = useState(initial)
  const value = useMemo(
    () => ({ freshness, setFreshness }),
    [freshness],
  )

  return (
    <SyncFreshnessContext.Provider value={value}>
      {children}
    </SyncFreshnessContext.Provider>
  )
}

export function useSyncFreshness(): SyncFreshnessContextValue {
  const ctx = useContext(SyncFreshnessContext)
  if (!ctx) {
    throw new Error('useSyncFreshness must be used within SyncFreshnessProvider')
  }
  return ctx
}
