import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { HeaderSkeleton } from '@/components/layout/header-skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarEdgeToggle } from '@/components/layout/sidebar-edge-toggle'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { ThemeProvider } from '@/components/layout/theme-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
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
      </SidebarProvider>
    </ThemeProvider>
  )
}
