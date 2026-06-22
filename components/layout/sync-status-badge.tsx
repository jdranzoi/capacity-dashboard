'use client'

import { SyncSnapshotIdCopy } from '@/components/layout/sync-snapshot-id-copy'
import { useSyncFreshness } from '@/components/layout/sync-freshness-context'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useState } from 'react'

type StatusTier = 'fresh' | 'stale' | 'old' | 'error'

function getStatusTier(syncedAt: string | null): StatusTier {
  if (!syncedAt) return 'error'
  const ageHours =
    (Date.now() - new Date(syncedAt).getTime()) / (1000 * 60 * 60)
  if (ageHours < 4) return 'fresh'
  if (ageHours < 24) return 'stale'
  return 'old'
}

const tierStyles: Record<StatusTier, string> = {
  fresh: 'bg-green-500/10 text-green-700 dark:text-green-400',
  stale: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  old: 'bg-red-500/10 text-red-700 dark:text-red-400',
  error: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const tierDot: Record<StatusTier, string> = {
  fresh: 'bg-green-500',
  stale: 'bg-yellow-500',
  old: 'bg-red-500',
  error: 'bg-red-500',
}

/** Relative “Synced … ago” label; recomputed every minute while the tab is open. */
export function SyncStatusBadge() {
  const { freshness } = useSyncFreshness()
  const [, tick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const { snapshotId, syncedAt } = freshness
  const tier = getStatusTier(syncedAt)
  const label = syncedAt
    ? `Synced ${formatDistanceToNow(new Date(syncedAt), { addSuffix: true })}`
    : 'Sync unavailable'

  return (
    <span
      className={`inline-flex max-w-full flex-wrap items-center gap-3 rounded-full px-2.5 py-1 text-xs font-medium ${tierStyles[tier]}`}
      title={snapshotId ?? undefined}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tierDot[tier]}`} />
      <span className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="shrink-0">{label}</span>
        {snapshotId && syncedAt ? (
          <>
            <span className="mx-0.5 shrink-0 opacity-50" aria-hidden>
              ·
            </span>
            <span className="min-w-0 break-all font-mono text-[10px] font-normal tracking-tight">
              {snapshotId}
            </span>
            <SyncSnapshotIdCopy snapshotId={snapshotId} />
          </>
        ) : null}
      </span>
    </span>
  );
}
