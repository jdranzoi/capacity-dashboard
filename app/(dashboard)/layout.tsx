import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarEdgeToggle } from '@/components/layout/sidebar-edge-toggle'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { createAuthClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function DashboardChromeFallback() {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <div
        className="h-full w-[var(--sidebar-w)] shrink-0 animate-pulse border-r bg-muted/30"
        aria-hidden
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-12 shrink-0 border-b bg-background/80 backdrop-blur-sm" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        </main>
      </div>
    </div>
  )
}

async function DashboardChrome({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <Sidebar />
      <SidebarEdgeToggle />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Suspense fallback={<DashboardChromeFallback />}>
          <DashboardChrome>{children}</DashboardChrome>
        </Suspense>
      </SidebarProvider>
    </ThemeProvider>
  )
}
