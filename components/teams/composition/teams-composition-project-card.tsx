import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { highlightTextMatch } from '@/lib/format/highlight-text-match'
import type { TeamsCompositionProject } from '@/lib/teams/composition/teams-composition-utils'

export function TeamsCompositionProjectCard({
  project,
  personQuery,
  projectQuery,
}: {
  project: TeamsCompositionProject
  personQuery: string | null
  projectQuery: string | null
}) {
  const rows = project.memberGroups.flatMap((group) =>
    group.members.map((member) => ({
      key: member.personId,
      roleLabel: group.roleLabel,
      personName: member.personName,
    }))
  )

  return (
    <Card
      size="sm"
      className="h-full"
      data-slot="teams-composition-project-card"
    >
      <CardHeader className="border-b border-border/60 pb-2.5">
        <CardTitle className="min-w-0 truncate whitespace-nowrap text-sm leading-snug tracking-tight">
          <span className="font-mono">
            {highlightTextMatch(project.projectKey, projectQuery)}
          </span>
          {project.projectName?.trim() &&
          project.projectName.trim() !== project.projectKey ? (
            <>
              <span className="font-sans text-muted-foreground"> — </span>
              <span className="font-sans font-medium">
                {highlightTextMatch(project.projectName.trim(), projectQuery)}
              </span>
            </>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2.5">
        {rows.length === 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            No planned assignments for this month.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row) => (
              <li
                key={row.key}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-3 whitespace-nowrap text-sm leading-none"
              >
                <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {row.roleLabel}
                </span>
                <span className="min-w-0 truncate text-right text-foreground">
                  {highlightTextMatch(row.personName, personQuery)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
