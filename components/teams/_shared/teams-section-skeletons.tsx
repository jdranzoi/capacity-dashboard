import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function TeamsKpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function TeamsDistributionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-xl border border-border" />
      <Skeleton className="h-80 rounded-xl border border-border" />
    </div>
  )
}

export function TeamsFutureCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-36 rounded-xl border border-border" />
      <Skeleton className="h-36 rounded-xl border border-border" />
    </div>
  )
}

export function TeamsCompositionGridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-30 -mx-8 flex gap-2 border-b border-border bg-background px-8 py-2.5 shadow-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-10">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl border border-border" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TeamsCollaborationSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <TeamsKpiRowSkeleton count={5} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="aspect-[88/58] rounded-xl border border-border lg:col-span-2" />
        <Skeleton className="h-[28rem] rounded-xl border border-border" />
      </div>
      <Skeleton className="h-64 rounded-xl border border-border" />
    </div>
  )
}

export function TeamsCollaborationPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton filterCount={3} />
      <TeamsCollaborationSkeleton />
    </div>
  )
}

export function TeamsPageSkeleton({ variant = 'overview' }: { variant?: 'overview' | 'composition' }) {
  return (
    <div className="flex flex-col gap-8">
      <DashboardSectionHeaderSkeleton filterCount={variant === 'composition' ? 3 : 1} />
      {variant === 'composition' ? (
        <TeamsCompositionGridSkeleton />
      ) : (
        <>
          <TeamsKpiRowSkeleton />
          <TeamsDistributionSkeleton />
          <TeamsFutureCardsSkeleton />
        </>
      )}
    </div>
  )
}
