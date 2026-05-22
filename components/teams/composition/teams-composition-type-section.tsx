import { TeamsCompositionProjectCard } from '@/components/teams/composition/teams-composition-project-card'
import {
  compositionSectionId,
  type TeamsCompositionTypeGroup,
} from '@/lib/teams/composition/teams-composition-utils'

export function TeamsCompositionTypeSection({
  group,
  personQuery,
  projectQuery,
}: {
  group: TeamsCompositionTypeGroup
  personQuery: string | null
  projectQuery: string | null
}) {
  const sectionId = compositionSectionId(group.projectType)

  return (
    <section
      id={sectionId}
      className="scroll-mt-14 space-y-3"
      data-slot={`teams-composition-${group.projectType}`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
        <h2 className="text-sm font-medium tracking-tight text-foreground">{group.label}</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {group.projects.length}
        </span>
      </div>
      {group.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active {group.label.toLowerCase()} projects for the current filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {group.projects.map((project) => (
            <TeamsCompositionProjectCard
              key={project.projectId}
              project={project}
              personQuery={personQuery}
              projectQuery={projectQuery}
            />
          ))}
        </div>
      )}
    </section>
  )
}
