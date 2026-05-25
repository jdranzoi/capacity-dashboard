/**
 * Sync freshness env names (dashboard + ingestion). Read with `process.env[DASHBOARD_SYNC_ENV.*]`.
 *
 * POLL_INTERVAL_MS — open-tab poll for new `sync_snapshot.id` (layout → SyncVersionWatcher).
 * REVALIDATE_SECRET — auth for POST /api/revalidate (ingestion calls after sync).
 * URL — dashboard base URL for that POST (ingestion only).
 * REVALIDATE_TARGETS — optional JSON [{ url, secret }] fan-out (ingestion only).
 */
export const DASHBOARD_SYNC_ENV = {
  POLL_INTERVAL_MS: 'DASHBOARD_SYNC_POLL_INTERVAL_MS',
  REVALIDATE_SECRET: 'DASHBOARD_SYNC_REVALIDATE_SECRET',
  URL: 'DASHBOARD_SYNC_URL',
  REVALIDATE_TARGETS: 'DASHBOARD_SYNC_REVALIDATE_TARGETS',
} as const

export const DASHBOARD_SYNC_DEFAULTS = {
  POLL_INTERVAL_MS: 90_000,
  POLL_INTERVAL_MIN_MS: 15_000,
} as const
