import { TeamsCompositionTypeSection } from '@/components/teams/composition/teams-composition-type-section'
import type { TeamsCompositionPayload } from '@/lib/teams/composition/teams-composition-utils'

export function TeamsCompositionGroups({ data }: { data: TeamsCompositionPayload }) {
  return (
    <div className="flex flex-col gap-6" data-slot="teams-composition-groups">
      {data.groups.map((group) => (
        <TeamsCompositionTypeSection
          key={group.projectType}
          group={group}
          personQuery={data.personQuery}
          projectQuery={data.projectQuery}
        />
      ))}
    </div>
  );
}

export function TeamsCompositionAlerts({ data }: { data: TeamsCompositionPayload }) {
  const hasActiveFilters = Boolean(data.personQuery || data.projectQuery || data.pmQuery)
  const filterMiss =
    hasActiveFilters && data.totalProjectCount > 0 && data.visibleProjectCount === 0

  if (!filterMiss && !(data.totalProjectCount === 0 && !hasActiveFilters)) {
    return null
  }

  return (
    <div className="flex flex-col gap-3" data-slot="teams-composition-alerts">
      {filterMiss ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No projects match the current filters for this month.
        </div>
      ) : null}
      {data.totalProjectCount === 0 && !hasActiveFilters ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No active projects for this period.
        </div>
      ) : null}
    </div>
  )
}
