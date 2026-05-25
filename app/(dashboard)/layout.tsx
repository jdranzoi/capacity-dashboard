import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { HeaderSkeleton } from '@/components/layout/header-skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarEdgeToggle } from '@/components/layout/sidebar-edge-toggle'
import { NavigationSearchProvider } from '@/components/layout/navigation-search-context'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { SyncFreshnessProvider } from '@/components/layout/sync-freshness-context'
import { SyncVersionWatcher } from '@/components/layout/sync-version-watcher'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { getLatestSyncSnapshot } from '@/lib/data/latest-sync-snapshot'
import {
  DASHBOARD_SYNC_DEFAULTS,
  DASHBOARD_SYNC_ENV,
} from '@/lib/sync/dashboard-sync-env'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const latest = await getLatestSyncSnapshot()

  const pollRaw = process.env[DASHBOARD_SYNC_ENV.POLL_INTERVAL_MS]?.trim()
  const pollParsed = pollRaw ? Number.parseInt(pollRaw, 10) : NaN
  const pollIntervalMs =
    Number.isFinite(pollParsed) &&
    pollParsed >= DASHBOARD_SYNC_DEFAULTS.POLL_INTERVAL_MIN_MS
      ? pollParsed
      : DASHBOARD_SYNC_DEFAULTS.POLL_INTERVAL_MS

  return (
    <ThemeProvider>
      <NavigationSearchProvider>
        <SidebarProvider>
          <SyncFreshnessProvider
            initial={{
              snapshotId: latest?.id ?? null,
              syncedAt: latest?.createdAt ?? null,
            }}
          >
            <SyncVersionWatcher
              pollIntervalMs={pollIntervalMs}
              initialSnapshotId={latest?.id ?? null}
            >
              <div className="relative flex h-screen overflow-hidden">
                <Sidebar />
                <SidebarEdgeToggle />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Suspense fallback={<HeaderSkeleton />}>
                    <Header />
                  </Suspense>
                  <main className="flex-1 overflow-y-auto p-8">{children}</main>
                </div>
              </div>
            </SyncVersionWatcher>
          </SyncFreshnessProvider>
        </SidebarProvider>
      </NavigationSearchProvider>
    </ThemeProvider>
  )
}
