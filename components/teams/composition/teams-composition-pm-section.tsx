import { TeamsCompositionProjectCard } from '@/components/teams/composition/teams-composition-project-card'
import { TEAMS_COMPOSITION_CARD_GRID_CLASS } from '@/components/teams/composition/teams-composition-layout'
import {
  compositionPmSectionId,
  type TeamsCompositionPmGroup,
} from '@/lib/teams/composition/teams-composition-utils'

export function TeamsCompositionPmSection({
  group,
  personQuery,
  projectQuery,
}: {
  group: TeamsCompositionPmGroup
  personQuery: string | null
  projectQuery: string | null
}) {
  const sectionId = compositionPmSectionId(group.personId)

  return (
    <section
      id={sectionId}
      className="scroll-mt-14 space-y-3"
      data-slot={
        group.personId
          ? `teams-composition-pm-${group.personId}`
          : 'teams-composition-pm-unassigned'
      }
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
        <h2 className="text-sm font-medium tracking-tight text-foreground">{group.personName}</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {group.projects.length}
        </span>
      </div>
      {group.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No planned projects for this project manager.
        </p>
      ) : (
        <div className={TEAMS_COMPOSITION_CARD_GRID_CLASS}>
          {group.projects.map((project) => (
            <TeamsCompositionProjectCard
              key={`${sectionId}-${project.projectId}`}
              project={project}
              personQuery={personQuery}
              projectQuery={projectQuery}
              highlightPmPersonId={group.personId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
