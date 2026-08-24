import { DashboardSectionHeaderSkeleton } from '@/components/layout/dashboard-section-header-skeleton'
import {
  TEAMS_COMPOSITION_CARD_GRID_CLASS,
  TEAMS_COMPOSITION_STICKY_NAV_CLASS,
} from '@/components/teams/composition/teams-composition-layout'
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

export function TeamsCompositionAnchorNavSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-md" />
      ))}
    </div>
  )
}

export function TeamsCompositionViewToggleSkeleton() {
  return <Skeleton className="h-8 w-44 shrink-0 rounded-lg" />
}

export function TeamsCompositionCardsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="scroll-mt-14 space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-6" />
          </div>
          <div className={TEAMS_COMPOSITION_CARD_GRID_CLASS}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border/60 px-3 py-2">
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-1.5 px-3 py-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamsCompositionGridSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className={TEAMS_COMPOSITION_STICKY_NAV_CLASS}>
        <TeamsCompositionAnchorNavSkeleton />
        <TeamsCompositionViewToggleSkeleton />
      </div>
      <TeamsCompositionCardsSkeleton />
    </div>
  )
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
        filterCount={variant === "composition" ? 4 : 1}
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
