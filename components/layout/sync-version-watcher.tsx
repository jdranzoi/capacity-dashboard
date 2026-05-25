'use client'

import { useSyncFreshness } from '@/components/layout/sync-freshness-context'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

type SyncVersionWatcherProps = {
  pollIntervalMs: number
  /** SSR snapshot id — avoids treating the first poll as a “new” sync. */
  initialSnapshotId: string | null
  children: React.ReactNode
}

/**
 * Polls `/api/sync-version` while the tab is visible.
 * Updates the header badge every poll; on new `sync_snapshot.id`, busts cache and refreshes data.
 */
export function SyncVersionWatcher({
  pollIntervalMs,
  initialSnapshotId,
  children,
}: SyncVersionWatcherProps) {
  const router = useRouter()
  const { setFreshness } = useSyncFreshness()
  const knownSnapshotId = useRef<string | null>(initialSnapshotId)
  const refreshing = useRef(false)

  const checkSync = useCallback(async () => {
    if (refreshing.current) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }

    try {
      const res = await fetch('/api/sync-version', { cache: 'no-store' })
      if (!res.ok) return

      const body = (await res.json()) as {
        snapshotId?: string | null
        syncedAt?: string | null
      }
      const remoteId = body.snapshotId ?? null
      const syncedAt = body.syncedAt ?? null

      setFreshness({ snapshotId: remoteId, syncedAt })

      if (!remoteId || remoteId === knownSnapshotId.current) return

      refreshing.current = true
      knownSnapshotId.current = remoteId

      await fetch('/api/sync-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: remoteId }),
      })

      router.refresh()
    } catch {
      // Retry on next poll or focus
    } finally {
      refreshing.current = false
    }
  }, [router, setFreshness])

  useEffect(() => {
    void checkSync()
  }, [checkSync])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void checkSync()
    }
    const onFocus = () => void checkSync()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    const intervalId = window.setInterval(() => void checkSync(), pollIntervalMs)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(intervalId)
    }
  }, [checkSync, pollIntervalMs])

  return <>{children}</>
}
