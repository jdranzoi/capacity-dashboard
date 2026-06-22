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
    <div className="grid gap-3 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-xl border border-border" />
      <Skeleton className="h-80 rounded-xl border border-border" />
    </div>
  );
}

export function TeamsFutureCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton className="h-36 rounded-xl border border-border" />
      <Skeleton className="h-36 rounded-xl border border-border" />
    </div>
  );
}

export function TeamsCompositionGridSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-30 -mx-8 flex gap-3 border-b border-border bg-background px-8 py-2.5 shadow-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-48 rounded-xl border border-border"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamsCollaborationSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <TeamsKpiRowSkeleton count={6} />
      <div className="grid min-w-0 gap-3 lg:h-[min(42rem,calc(100vh-11rem))] lg:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)]">
        <Skeleton className="h-72 rounded-xl border border-border lg:h-auto" />
        <Skeleton className="h-72 rounded-xl border border-border lg:h-auto" />
        <Skeleton className="h-72 rounded-xl border border-border lg:h-auto" />
      </div>
    </div>
  );
}

export function TeamsCollaborationPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardSectionHeaderSkeleton filterCount={3} />
      <TeamsCollaborationSkeleton />
    </div>
  );
}

export function TeamsPageSkeleton({ variant = 'overview' }: { variant?: 'overview' | 'composition' }) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardSectionHeaderSkeleton
        filterCount={variant === "composition" ? 3 : 1}
      />
      {variant === "composition" ? (
        <TeamsCompositionGridSkeleton />
      ) : (
        <>
          <TeamsKpiRowSkeleton />
          <TeamsDistributionSkeleton />
          <TeamsFutureCardsSkeleton />
        </>
      )}
    </div>
  );
}
